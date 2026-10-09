# Presentation demo guide

## 5–7 minute demo

1. Open the collection at http://localhost:4200. Explain music/movie as category and CD/DVD as format.
2. Filter Music and CD. Show availability, daily rental price and late rate.
3. Register a new fictional customer. Registration cannot choose an admin role.
4. Rent Moonlit Sessions for three days. Explain immediate stock allocation and the fee preview.
5. Open My rentals. Show due date, current status and fee. Refresh to demonstrate authentication restoration.
6. Sign out. Sign in as the local demo admin (`admin@example.com` / `ChangeMe123!`, unless customized).
7. Open Media. Add a temporary title, edit its fee, and delete it. Explain complete CRUD.
8. Open Customers. Show the registered customer. Explain password filtering and role protection.
9. Open Rentals & returns. Receive the customer copy, confirm the return and show the final total.
10. Return to the public collection. The available copy count recovers. Show the architecture, ERD and Docker services.

No online payment occurs. Fees represent charges. One-day rentals starting October 9 are due October 10. Late fees start after the due date and use the original daily rate.

## ရှင်းပြရန် အဓိကအချက်များ

- API က routes → middleware → controller → model → MySQL အဆင့်လိုက် စီမံပါတယ်။
- users/media/rentals table ၃ ခုသာရှိလို့ ERD ကို နားလည်ရလွယ်ပါတယ်။
- Password ကို bcrypt နဲ့ hash လုပ်ပြီး login အောင်မှ JWT ထုတ်ပါတယ်။
- Customer က မိမိ rental ကိုပဲ ကြည့်နိုင်ပြီး Admin က CRUD နဲ့ return လုပ်နိုင်ပါတယ်။
- Database transaction + row lock နဲ့ နောက်ဆုံး copy ကို တစ်ပြိုင်နက်ငှားခြင်း ကာကွယ်ပါတယ်။
- UUID request key ကြောင့် network retry မှာ rental ထပ်မပေါ်ပါဘူး။
- Docker volume ကြောင့် container restart ပြီး data ကျန်ပါတယ်။

## Useful commands

```sh
# Backend folder
docker compose ps
npm test
docker compose -f docker-compose.test.yml up -d --wait
npm run test:integration
# Frontend folder
npm run build
```

A fictional Demo Customer with two returned rentals may exist in the prepared local demo database. Fresh installations contain only the admin and sample media. Create a new customer during the presentation.
