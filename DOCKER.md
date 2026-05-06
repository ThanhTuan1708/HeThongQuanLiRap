# Chay du an bang Docker

## Khoi dong

```powershell
docker compose up --build
```

Sau khi chay xong:

- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:3000
- API base: http://127.0.0.1:3000/api/v1
- MongoDB: mongodb://127.0.0.1:27017/QuanLiRapChieuPhim

## Seed du lieu mau

Chay lenh nay sau khi cac container da khoi dong:

```powershell
docker compose exec backend npm run seed
```

Tai khoan mau:

- Admin: admin@rapchieuphim.com / admin123456
- User: user@gmail.com / user123456

## Dung he thong

```powershell
docker compose down
```

Neu muon xoa luon du lieu MongoDB:

```powershell
docker compose down -v
```
