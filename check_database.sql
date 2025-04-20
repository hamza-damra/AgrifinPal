-- Check carts table
SELECT * FROM carts LIMIT 10;

-- Check cart_items table
SELECT * FROM cart_items LIMIT 10;

-- Check users table
SELECT user_id, username, email, full_name FROM users LIMIT 10;

-- Check products table
SELECT product_id, product_name, price, quantity FROM products LIMIT 10;
