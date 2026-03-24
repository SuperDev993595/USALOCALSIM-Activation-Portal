Developer Q&A - 
1. Is $4 SIM deduction fixed for all markets or configurable?
 It must be configurable in the Admin Dashboard. I need to be able to adjust this value per market or per batch of ICCIDs in the future without changing the code.
2. Are voucher plans strictly only 7/15/30 days now, or expandable?
Expandable. The database should support any duration I define (7, 15, 30, 60, 90 days, etc.). Each plan should be treated as a "Product" that I can add or edit later.
3. For voucher path, should email be mandatory for all physical redemptions too, or only eSIM?
Mandatory for ALL. Since I will activate them manually based on the Travel Date, I need the email to send the confirmation exactly when the service goes live. It is also my primary tool for fraud prevention and customer support.
4. Should customer see “processing” always, or “success active” only after manual completion?
The customer should see "Scheduled / Processing" after payment.
Since they will provide a Travel Date, the UI should say: "Payment Confirmed! Your activation is scheduled for [Travel Date]."
The status should only change to "Success / Active" after I manually click the "Activate" button in the Admin Panel on the day of their trip. This triggers the final confirmation email.

Additional Recommendations (Manual Workflow):
- Activation Queue: Please create an Admin view sorted by "Travel Date". I need to see a "Due Today" list so I know exactly which ICCIDs to activate each morning.
- Email Automation: When I click "Mark as Active," the system must automatically send the "Your SIM is now Active" email to the customer.
- Status Sync: Use WebSockets or Long Polling so the customer’s "Order Status" page updates to "Active" the moment I click the button, creating the illusion of a seamless automated system.

Pls do not forget the ICC SIM CARD Activation requires to open a calendar to the customer to choose when he needs to have activated his card base on his travelling wishes
also the same logically for the normal vouchers and eSIM vouchers..
remenber there ae two types of vouchers...one is for top-up the sim cards and the other is to top-up the eSIM...hopeyou get it