"""
Loyalty Service - Calculate points and manage VIP tiers
"""
from sqlalchemy.orm import Session
from decimal import Decimal

from app.models.user import User
from app.models.enums import VipTier
from app.schemas.user import LoyaltyInfo


class LoyaltyService:
    """Service for loyalty program management"""
    
    # Conversion rate: 1,000,000 VND = 100 points
    POINTS_PER_MILLION = 100
    
    # Tier thresholds
    TIER_THRESHOLDS = {
        VipTier.MEMBER: 0,
        VipTier.SILVER: 1000,
        VipTier.GOLD: 5000,
        VipTier.DIAMOND: 10000
    }
    
    # Tier discounts (percentage)
    TIER_DISCOUNTS = {
        VipTier.MEMBER: 0,
        VipTier.SILVER: 5,
        VipTier.GOLD: 10,
        VipTier.DIAMOND: 15
    }
    
    @staticmethod
    def calculate_points_from_amount(amount: Decimal) -> int:
        """
        Calculate loyalty points from order amount
        Example: 5,000,000 VND = 500 points
        """
        millions = amount / 1_000_000
        return int(millions * LoyaltyService.POINTS_PER_MILLION)
    
    @staticmethod
    def get_tier_from_points(points: int) -> VipTier:
        """Determine VIP tier based on points"""
        if points >= LoyaltyService.TIER_THRESHOLDS[VipTier.DIAMOND]:
            return VipTier.DIAMOND
        elif points >= LoyaltyService.TIER_THRESHOLDS[VipTier.GOLD]:
            return VipTier.GOLD
        elif points >= LoyaltyService.TIER_THRESHOLDS[VipTier.SILVER]:
            return VipTier.SILVER
        else:
            return VipTier.MEMBER
    
    @staticmethod
    def get_discount_percentage(tier: VipTier) -> float:
        """Get discount percentage for tier"""
        return LoyaltyService.TIER_DISCOUNTS[tier]
    
    @staticmethod
    def add_points(db: Session, user: User, order_amount: Decimal) -> User:
        """
        Add points after order completion
        Automatically upgrade tier if threshold reached
        """
        points_earned = LoyaltyService.calculate_points_from_amount(order_amount)
        user.loyalty_points += points_earned
        
        # Auto upgrade tier
        new_tier = LoyaltyService.get_tier_from_points(user.loyalty_points)
        if new_tier != user.vip_tier:
            user.vip_tier = new_tier
            # TODO: Send notification about tier upgrade
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_loyalty_info(user: User) -> LoyaltyInfo:
        """Get user's loyalty program information"""
        current_tier = user.vip_tier
        current_points = user.loyalty_points
        
        # Find next tier
        next_tier = None
        points_to_next = None
        
        tier_list = [VipTier.MEMBER, VipTier.SILVER, VipTier.GOLD, VipTier.DIAMOND]
        current_index = tier_list.index(current_tier)
        
        if current_index < len(tier_list) - 1:
            next_tier = tier_list[current_index + 1]
            points_to_next = LoyaltyService.TIER_THRESHOLDS[next_tier] - current_points
        
        return LoyaltyInfo(
            current_points=current_points,
            current_tier=current_tier,
            next_tier=next_tier,
            points_to_next_tier=points_to_next,
            tier_discount=LoyaltyService.get_discount_percentage(current_tier)
        )
