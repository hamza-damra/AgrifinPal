-- Clear all cart items to resolve constraint issues
delete from cart_items where true;
