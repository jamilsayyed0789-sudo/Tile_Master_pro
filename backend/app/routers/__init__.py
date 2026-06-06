from app.routers.auth import auth_router
from app.routers.catalog import catalog_router
from app.routers.subscription import subscription_router
# from app.routers.payment import payment_router  # Razorpay temporarily disabled

__all__ = ["auth_router", "catalog_router", "subscription_router"]  # , "payment_router"]
