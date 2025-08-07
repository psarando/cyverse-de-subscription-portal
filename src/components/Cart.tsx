"use client";

/**
 * Cart component that displays the shopping cart icon with a badge
 * indicating the number of items in the cart.
 *
 * @author psarando
 */
import { useCartInfo } from "@/contexts/cart";

import { Badge, IconButton, Tooltip } from "@mui/material";
import CartIcon from "@mui/icons-material/ShoppingBasket";

const Cart = () => {
    const [cartInfo] = useCartInfo();

    const badgeContent = cartInfo.subscription ? 1 : 0;

    return (
        <Tooltip title="Checkout">
            <IconButton color="inherit" size="large">
                <Badge color="error" badgeContent={badgeContent}>
                    <CartIcon />
                </Badge>
            </IconButton>
        </Tooltip>
    );
};

export default Cart;
