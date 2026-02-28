# Running on Windows (XAMPP)

## 1) Start services
- Open XAMPP Control Panel.
- Start Apache and MySQL.

## 2) Import database
Use phpMyAdmin to import the combined seed file:
- Open: `http://localhost/phpmyadmin`
- Create database: `farmproduce`
- Import: `seed_all.sql`

This creates all tables and seeds the admin account.

Admin credentials:
- Email: `winnie@gmail.com`
- Password: `winnie$##1`

## 3) Verify uploads folder
Ensure this folder exists and is writable:
- `winnie/uploads/`

## 4) Open the app
- `http://localhost/winnie/`

## 5) Login by role
- Admin: `http://localhost/winnie/admin-login.html`
- Farmer/Buyer: `http://localhost/winnie/login.html`

## Notes
- If you re-run `seed_admin.php`, it will update the admin account.
- The app uses live data only. If tables are empty, pages will show "No data available".
