import os, smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.environ["DB_URL"], pool_pre_ping=True)
SECRET, ALGO = os.environ["JWT_SECRET"], "HS256"
pwd = CryptContext(schemes=["bcrypt"])
oauth = OAuth2PasswordBearer(tokenUrl="api/auth/login")
app = FastAPI(title="Sri Sai Krishna Pharmacy API")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:4200")],
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def seed_admin():
    with engine.begin() as c:
        if not c.execute(text("SELECT 1 FROM Users WHERE Username='admin'")).first():
            c.execute(text("INSERT Users(Username,PasswordHash,FullName,RoleId) VALUES('admin',:h,'Administrator',(SELECT Id FROM Roles WHERE Name='Admin'))"),
                      {"h": pwd.hash("Admin@123")})

def current_user(token: str = Depends(oauth)):
    try:
        p = jwt.decode(token, SECRET, algorithms=[ALGO])
        return {"id": int(p["sub"]), "role": p["role"]}
    except (JWTError, KeyError):
        raise HTTPException(401, "Invalid or expired token")

def require(*roles):
    def dep(u=Depends(current_user)):
        if u["role"] not in roles:
            raise HTTPException(403, "You do not have access to this action")
        return u
    return dep

@app.post("/api/auth/login")
def login(f: OAuth2PasswordRequestForm = Depends()):
    with engine.connect() as c:
        r = c.execute(text("SELECT u.Id,u.PasswordHash,r.Name role FROM Users u JOIN Roles r ON r.Id=u.RoleId WHERE u.Username=:n AND u.IsActive=1"),
                      {"n": f.username}).mappings().first()
    if not r or not pwd.verify(f.password, r["PasswordHash"]):
        raise HTTPException(401, "Wrong username or password")
    exp = datetime.utcnow() + timedelta(hours=8)
    return {"access_token": jwt.encode({"sub": str(r["Id"]), "role": r["role"], "exp": exp}, SECRET, ALGO),
            "token_type": "bearer", "role": r["role"]}

class MedicineIn(BaseModel):
    Name: str; GenericName: Optional[str] = None; CategoryId: Optional[int] = None
    Manufacturer: Optional[str] = None; Mrp: float; GstPercent: float = 12; ReorderLevel: int = 10

@app.get("/api/medicines")  # public: powers Products page
def medicines(q: str = "", category: Optional[int] = None):
    sql = """SELECT m.Id,m.Name,m.GenericName,c.Name Category,m.Manufacturer,m.Mrp,
             ISNULL((SELECT SUM(Quantity) FROM MedicineBatches b WHERE b.MedicineId=m.Id AND b.ExpiryDate>GETDATE()),0) InStock
             FROM Medicines m LEFT JOIN Categories c ON c.Id=m.CategoryId
             WHERE m.IsActive=1 AND (m.Name LIKE :q OR m.GenericName LIKE :q) AND (:cat IS NULL OR m.CategoryId=:cat)"""
    with engine.connect() as c:
        return [dict(r) for r in c.execute(text(sql), {"q": f"%{q}%", "cat": category}).mappings()]

@app.post("/api/medicines", dependencies=[Depends(require("Admin", "Pharmacist"))])
def add_medicine(m: MedicineIn):
    with engine.begin() as c:
        return {"id": c.execute(text("""INSERT Medicines(Name,GenericName,CategoryId,Manufacturer,Mrp,GstPercent,ReorderLevel)
            OUTPUT INSERTED.Id VALUES(:Name,:GenericName,:CategoryId,:Manufacturer,:Mrp,:GstPercent,:ReorderLevel)"""), m.model_dump()).scalar()}

class BatchIn(BaseModel):
    MedicineId: int; BatchNo: str; ExpiryDate: str; PurchasePrice: float; Quantity: int

@app.post("/api/medicines/batches", dependencies=[Depends(require("Admin", "Pharmacist"))])
def add_batch(b: BatchIn):
    with engine.begin() as c:
        c.execute(text("INSERT MedicineBatches(MedicineId,BatchNo,ExpiryDate,PurchasePrice,Quantity) VALUES(:MedicineId,:BatchNo,:ExpiryDate,:PurchasePrice,:Quantity)"), b.model_dump())
    return {"ok": True}

@app.get("/api/medicines/low-stock", dependencies=[Depends(require("Admin", "Pharmacist"))])
def low_stock():
    with engine.connect() as c:
        return [dict(r) for r in c.execute(text("""SELECT m.Id,m.Name,m.ReorderLevel,ISNULL(SUM(b.Quantity),0) Qty FROM Medicines m
            LEFT JOIN MedicineBatches b ON b.MedicineId=m.Id GROUP BY m.Id,m.Name,m.ReorderLevel HAVING ISNULL(SUM(b.Quantity),0)<=m.ReorderLevel""")).mappings()]

class Line(BaseModel): MedicineId: int; Quantity: int
class SaleIn(BaseModel): CustomerId: Optional[int] = None; Discount: float = 0; Items: list[Line]

@app.post("/api/sales")
def create_sale(s: SaleIn, u=Depends(require("Admin", "Pharmacist", "Cashier"))):
    """Creates a bill; deducts stock from earliest-expiring batches first (FEFO)."""
    with engine.begin() as c:
        sale_id = c.execute(text("INSERT Sales(CustomerId,SoldBy,Discount,Total) OUTPUT INSERTED.Id VALUES(:c,:u,:d,0)"),
                            {"c": s.CustomerId, "u": u["id"], "d": s.Discount}).scalar()
        total = 0.0
        for it in s.Items:
            mrp = c.execute(text("SELECT Mrp FROM Medicines WHERE Id=:i"), {"i": it.MedicineId}).scalar()
            if mrp is None: raise HTTPException(404, f"Medicine {it.MedicineId} not found")
            need = it.Quantity
            batches = c.execute(text("SELECT Id,Quantity FROM MedicineBatches WHERE MedicineId=:i AND Quantity>0 AND ExpiryDate>GETDATE() ORDER BY ExpiryDate"),
                                {"i": it.MedicineId}).mappings().all()
            for b in batches:
                take = min(need, b["Quantity"])
                c.execute(text("UPDATE MedicineBatches SET Quantity=Quantity-:t WHERE Id=:b"), {"t": take, "b": b["Id"]})
                c.execute(text("INSERT SaleItems(SaleId,MedicineId,BatchId,Quantity,UnitPrice) VALUES(:s,:m,:b,:q,:p)"),
                          {"s": sale_id, "m": it.MedicineId, "b": b["Id"], "q": take, "p": float(mrp)})
                total += take * float(mrp); need -= take
                if need == 0: break
            if need > 0: raise HTTPException(400, f"Not enough stock for medicine {it.MedicineId}")
        total -= s.Discount
        c.execute(text("UPDATE Sales SET Total=:t WHERE Id=:i"), {"t": total, "i": sale_id})
    return {"saleId": sale_id, "total": round(total, 2)}

@app.get("/api/reports/sales", dependencies=[Depends(require("Admin", "Pharmacist"))])
def sales_report():
    with engine.connect() as c:
        return [dict(r) for r in c.execute(text("SELECT CAST(SaleDate AS DATE) Day,COUNT(*) Bills,SUM(Total) Revenue FROM Sales GROUP BY CAST(SaleDate AS DATE) ORDER BY Day DESC")).mappings()]

class InquiryIn(BaseModel):
    name: str; email: EmailStr; phone: Optional[str] = ""; subject: str = "Website inquiry"; message: str

@app.post("/api/contact")
def contact(i: InquiryIn):
    with engine.begin() as c:
        c.execute(text("INSERT Inquiries(Name,Email,Phone,Subject,Message) VALUES(:name,:email,:phone,:subject,:message)"), i.model_dump())
    msg = EmailMessage()
    msg["Subject"] = f"[Website] {i.subject}"; msg["From"] = os.environ["SMTP_USER"]
    msg["To"] = os.environ["STORE_EMAIL"]; msg["Reply-To"] = i.email
    msg.set_content(f"From: {i.name} <{i.email}>\nPhone: {i.phone}\n\n{i.message}")
    try:
        with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.environ["SMTP_PORT"])) as s:
            s.starttls(); s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"]); s.send_message(msg)
    except Exception:
        return {"ok": True, "emailed": False}  # saved in DB; email delivery failed
    return {"ok": True, "emailed": True}
