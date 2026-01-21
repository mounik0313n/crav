# Debugging: Restaurant Dashboard Revenue Not Updating

## Issue
Restaurant today's revenue and today's orders showing as 0.

## Root Causes Identified

### 1. **Payment Status vs Order Status**
- **Problem**: Query was filtering by `Order.status == 'completed'` 
- **Reality**: Order workflow is:
  - Payment made → `status = 'placed'`, `payment_status = 'paid'` ✅ REVENUE SHOULD COUNT HERE
  - Restaurant preparing → `status = 'preparing'`
  - Customer OTP verified → `status = 'completed'`
- **Fix**: Changed to use `Order.payment_status == 'paid'` (confirmed revenue)

### 2. **DateTime vs Date Comparison (CRITICAL)**
- **Problem**: Using `func.cast(Order.created_at, Date) == today` doesn't work reliably with UTC timestamps
- **Root Cause**: `created_at` uses `datetime.utcnow` but `date.today()` is local time (timezone mismatch)
- **Fix**: Changed to datetime range comparison:
  ```python
  today_start = datetime.combine(today, datetime.min.time())
  today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
  
  Order.created_at >= today_start AND Order.created_at < today_end
  ```

## Changes Made

### Backend: `/api/restaurant/dashboard`
✅ Now filters by `payment_status == 'paid'`
✅ Uses datetime range instead of date equality
✅ Added debug logging to console

### Backend: `/api/restaurant/analytics`  
✅ Updated total revenue/orders to use `payment_status == 'paid'`
✅ Updated daily sales query to use `payment_status == 'paid'`

### Frontend: RestaurantDashboardPage.js
✅ Added console.log statements for debugging

## Testing Steps

### 1. Check Debug Logs
Open browser DevTools Console to see frontend logs:
```
[DEBUG-FE] Fetching dashboard data...
[DEBUG-FE] Response Data: {...}
[DEBUG-FE] Stats Updated: {...}
```

### 2. Check Server Logs
In Flask terminal, you should see:
```
[DEBUG] Restaurant ID: X, Today: YYYY-MM-DD, Range: ... to ...
[DEBUG] Today's Revenue: X.XX, Today's Orders: Y
```

### 3. Use Debug Endpoint
Make a GET request to check raw data:
```
GET /api/restaurant/debug/orders
Headers: Authentication-Token: <your_token>
```

This will show:
- All recent orders with timestamps
- How many orders exist today
- How many PAID orders exist today
- Raw order details

### 4. Create a Test Order
1. Log in as customer
2. Place and pay for an order to the restaurant
3. Check dashboard - revenue should update immediately after payment

## Expected Behavior

After payment verification:
- Dashboard should show today's revenue (not 0)
- Dashboard should increment today's orders count
- Stats should update in real-time

## Files Modified
1. `backend/routes.py`
   - `restaurant_dashboard_stats()` - Fixed revenue calculation
   - `get_restaurant_analytics()` - Fixed revenue calculation
   - Added `debug_restaurant_orders()` endpoint
   
2. `frontend/pages/restaurant/RestaurantDashboardPage.js`
   - Added console logging for debugging

## Next Steps if Still Not Working

1. Check if any orders exist with `payment_status = 'paid'`
2. Verify the order timestamp in database (check if UTC is causing issues)
3. Check if there's a timezone configuration in Flask config
4. Review payment integration - ensure `payment_status` is being set to 'paid' after successful payment
