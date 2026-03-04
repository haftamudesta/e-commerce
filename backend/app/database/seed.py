import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from passlib.context import CryptContext
import uuid
import os

from app.database.database import AsyncSessionLocal, engine, Base
from app.models.users import User
from app.models.categories import Category
from app.models.products import Product, ProductImage

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


CATEGORIES = [
    {"name": "Electronics"},
    {"name": "Computers & Accessories"},
    {"name": "Home & Kitchen"},
    {"name": "Audio"},
    {"name": "Smart Home"},
    {"name": "Wearable Technology"},
    {"name": "Cameras & Photography"},
    {"name": "Gaming"},
    {"name": "Office Products"},
    {"name": "Health & Wellness"},
]

PRODUCTS = [
    {
        "name": "Smartphone 5G 128GB",
        "description": "Latest 5G smartphone with 128GB storage, 6.5-inch AMOLED display, triple camera system, and all-day battery life. Unlocked for all carriers.",
        "price": 899.99,
        "quantity": 30,
        "category": "Electronics",
        "slug": "smartphone-5g-128gb",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Samsung Galaxy S24 Ultra",
        "description": "Premium Android smartphone with 200MP camera, S Pen support, and 8K video recording. 512GB storage with expandable memory.",
        "price": 1299.99,
        "quantity": 20,
        "category": "Electronics",
        "slug": "samsung-galaxy-s24-ultra",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "4K Ultra HD Smart TV 55-inch",
        "description": "55-inch 4K UHD Smart TV with HDR, built-in streaming apps, voice control, and slim bezel design. Experience cinema-quality picture at home.",
        "price": 699.99,
        "quantity": 15,
        "category": "Electronics",
        "slug": "4k-ultra-hd-smart-tv-55",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "4K Ultra HD Smart TV 65-inch",
        "description": "65-inch 4K UHD Smart TV with HDR, built-in streaming apps, voice control, and slim bezel design. Experience cinema-quality picture at home.",
        "price": 999.99,
        "quantity": 10,
        "category": "Electronics",
        "slug": "4k-ultra-hd-smart-tv-65",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Premium Tablet 11-inch",
        "description": "11-inch premium tablet with 256GB storage, retina display, and all-day battery life. Perfect for entertainment, creativity, and productivity.",
        "price": 449.99,
        "quantity": 22,
        "category": "Electronics",
        "slug": "premium-tablet-11-inch",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Premium Tablet 13-inch",
        "description": "13-inch premium tablet with 512GB storage, retina display, and all-day battery life. Perfect for professionals and creatives.",
        "price": 649.99,
        "quantity": 18,
        "category": "Electronics",
        "slug": "premium-tablet-13-inch",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Digital Camera 4K",
        "description": "Compact digital camera with 4K video recording, 20MP sensor, and 3-inch flip screen. Perfect for vlogging and travel photography.",
        "price": 349.99,
        "quantity": 18,
        "category": "Electronics",
        "slug": "digital-camera-4k",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop"
        ]
    },
    
    {
        "name": "Smart Speaker with Alexa",
        "description": "Voice-controlled smart speaker with premium sound, smart home hub, and privacy controls. Play music, set timers, and control smart devices.",
        "price": 89.99,
        "quantity": 65,
        "category": "Electronics",
        "slug": "smart-speaker-alexa",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Power Bank 20000mAh",
        "description": "High-capacity portable charger with fast charging, dual USB ports, and LED indicator. Charge smartphones, tablets, and other devices on the go.",
        "price": 39.99,
        "quantity": 95,
        "category": "Electronics",
        "slug": "power-bank-20000mah",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Laptop Pro 13-inch",
        "description": "Powerful laptop with 8GB RAM, 256GB SSD, Intel Core i5 processor, and stunning 13-inch Retina display. Perfect for students and professionals.",
        "price": 999.99,
        "quantity": 25,
        "category": "Computers & Accessories",
        "slug": "laptop-pro-13-inch",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Laptop Pro 15-inch",
        "description": "Powerful laptop with 16GB RAM, 512GB SSD, Intel Core i7 processor, and stunning 15-inch Retina display. Perfect for professionals and creators.",
        "price": 1499.99,
        "quantity": 20,
        "category": "Computers & Accessories",
        "slug": "laptop-pro-15-inch",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Gaming Laptop 17-inch",
        "description": "High-performance gaming laptop with RTX 4060, 16GB RAM, 1TB SSD, and 165Hz display. Experience smooth gameplay at max settings.",
        "price": 1999.99,
        "quantity": 10,
        "category": "Computers & Accessories",
        "slug": "gaming-laptop-17-inch",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Wireless Mouse Pro",
        "description": "Professional wireless mouse with ultra-fast response, 6 programmable buttons, and 2.4GHz wireless connection. Perfect for productivity and design work.",
        "price": 39.99,
        "quantity": 85,
        "category": "Computers & Accessories",
        "slug": "wireless-mouse-pro",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1629429408209-1f912961db70?w=500&auto=format&fit=crop"
        ]
    },
    
    {
        "name": "Mechanical Keyboard",
        "description": "Tenkeyless mechanical keyboard with Cherry MX Brown switches and customizable RGB lighting. Perfect for typing and gaming.",
        "price": 79.99,
        "quantity": 50,
        "category": "Computers & Accessories",
        "slug": "mechanical-keyboard",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1541140532154-bc957cbb44ac?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Portable External SSD 1TB",
        "description": "Ultra-fast portable SSD with 1TB storage, USB 3.2 interface, and shock-resistant design. Perfect for backing up photos, videos, and files.",
        "price": 129.99,
        "quantity": 35,
        "category": "Computers & Accessories",
        "slug": "portable-external-ssd-1tb",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "External HDD 4TB",
        "description": "High-capacity external hard drive with 4TB storage, USB 3.0, and backup software. Perfect for mass storage and backups.",
        "price": 99.99,
        "quantity": 40,
        "category": "Computers & Accessories",
        "slug": "external-hdd-4tb",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Laptop Stand Adjustable",
        "description": "Ergonomic aluminum laptop stand with 7 adjustable angles. Improves posture and cooling while working from home or office.",
        "price": 34.99,
        "quantity": 70,
        "category": "Computers & Accessories",
        "slug": "laptop-stand-adjustable",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=500&auto=format&fit=crop"
        ]
    },

    {
        "name": "Wireless Bluetooth Headphones",
        "description": "Premium over-ear headphones with 30-hour battery life, active noise cancellation, and crystal clear sound quality. Perfect for music lovers and frequent travelers.",
        "price": 199.99,
        "quantity": 50,
        "category": "Audio",
        "slug": "wireless-bluetooth-headphones",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Noise Cancelling Headphones",
        "description": "Industry-leading noise cancelling headphones with 40-hour battery life and premium sound quality. Perfect for travel and focus.",
        "price": 299.99,
        "quantity": 30,
        "category": "Audio",
        "slug": "noise-cancelling-headphones",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1545127398-14699f92334b?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Bluetooth Speaker Waterproof",
        "description": "Portable waterproof Bluetooth speaker with 20W sound, 12-hour battery, and rugged design. Perfect for outdoor adventures.",
        "price": 79.99,
        "quantity": 50,
        "category": "Audio",
        "slug": "bluetooth-speaker-waterproof",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1545454678-2f9c3b5b7b1b?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Party Speaker with Lights",
        "description": "Powerful party speaker with 100W output, RGB light show, and karaoke features. Bluetooth connectivity and 8-hour battery life.",
        "price": 149.99,
        "quantity": 25,
        "category": "Audio",
        "slug": "party-speaker-with-lights",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "True Wireless Earbuds",
        "description": "Compact true wireless earbuds with charging case, touch controls, and crystal clear audio. Perfect for workouts and daily commute.",
        "price": 89.99,
        "quantity": 75,
        "category": "Audio",
        "slug": "true-wireless-earbuds",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1590658268037-6bf1dbc3d3a2?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Premium Earbuds Pro",
        "description": "High-end true wireless earbuds with active noise cancellation, wireless charging, and spatial audio. Premium sound quality.",
        "price": 199.99,
        "quantity": 40,
        "category": "Audio",
        "slug": "premium-earbuds-pro",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Soundbar with Subwoofer",
        "description": "2.1 channel soundbar with wireless subwoofer and Bluetooth. Transform your TV audio with immersive surround sound.",
        "price": 149.99,
        "quantity": 25,
        "category": "Audio",
        "slug": "soundbar-with-subwoofer",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1589003077984-894678bcb9f7?w=500&auto=format&fit=crop"
        ]
    },
    
    {
        "name": "Mechanical Gaming Keyboard RGB",
        "description": "RGB mechanical gaming keyboard with blue switches, programmable macros, and durable aluminum construction. Built for gamers and typists.",
        "price": 89.99,
        "quantity": 45,
        "category": "Gaming",
        "slug": "mechanical-gaming-keyboard-rgb",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1541140532154-bc957cbb44ac?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Gaming Mouse Pad RGB Large",
        "description": "Large RGB gaming mouse pad with non-slip rubber base, waterproof surface, and 15 lighting modes. Perfect for gamers and designers.",
        "price": 29.99,
        "quantity": 75,
        "category": "Gaming",
        "slug": "gaming-mouse-pad-rgb-large",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Gaming Mouse Pad Extended",
        "description": "Extended gaming mouse pad covering full desk, with stitched edges and non-slip base. Perfect for low DPI gamers.",
        "price": 34.99,
        "quantity": 60,
        "category": "Gaming",
        "slug": "gaming-mouse-pad-extended",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1605106702734-20544f24c5a5?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Gaming Headset with Mic",
        "description": "Surround sound gaming headset with noise-canceling microphone, RGB lighting, and memory foam ear cushions. Compatible with PC, PS5, and Xbox.",
        "price": 59.99,
        "quantity": 40,
        "category": "Gaming",
        "slug": "gaming-headset-with-mic",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1599669454699-248893623440?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Wireless Gaming Headset",
        "description": "Wireless gaming headset with 30-hour battery, low-latency connection, and flip-to-mute microphone. Freedom to game without wires.",
        "price": 89.99,
        "quantity": 30,
        "category": "Gaming",
        "slug": "wireless-gaming-headset",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599669454699-248893623440?w=500&auto=format&fit=crop"
        ]
    },

    {
        "name": "Coffee Maker Espresso",
        "description": "15-bar espresso machine with milk frother for lattes and cappuccinos. Brew barista-quality coffee at home.",
        "price": 199.99,
        "quantity": 40,
        "category": "Home & Kitchen",
        "slug": "coffee-maker-espresso",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Drip Coffee Maker",
        "description": "12-cup programmable drip coffee maker with thermal carafe and auto-brew feature. Wake up to fresh coffee every morning.",
        "price": 79.99,
        "quantity": 55,
        "category": "Home & Kitchen",
        "slug": "drip-coffee-maker",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Digital Air Fryer XL 5.5QT",
        "description": "5.5QT digital air fryer with 8 presets, shake reminder, and dishwasher-safe parts. Cook crispy, delicious food with 85% less oil.",
        "price": 99.99,
        "quantity": 42,
        "category": "Home & Kitchen",
        "slug": "digital-air-fryer-xl-5-5qt",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Compact Air Fryer 3.5QT",
        "description": "3.5QT compact air fryer perfect for small kitchens, with 4 presets and easy-clean basket. Healthy cooking for 1-2 people.",
        "price": 69.99,
        "quantity": 50,
        "category": "Home & Kitchen",
        "slug": "compact-air-fryer-3-5qt",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1625937281717-8e0c3f6b7b0a?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Blender High-Speed",
        "description": "High-speed blender with 1000W motor, 64oz pitcher, and variable speeds. Perfect for smoothies, soups, and crushing ice.",
        "price": 79.99,
        "quantity": 55,
        "category": "Home & Kitchen",
        "slug": "blender-high-speed",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1570329619573-9c2f7d8c2b7d?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Personal Blender",
        "description": "Compact personal blender with 20oz to-go cup and travel lid. Perfect for single-serve smoothies and shakes.",
        "price": 34.99,
        "quantity": 80,
        "category": "Home & Kitchen",
        "slug": "personal-blender",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1570329619573-9c2f7d8c2b7d?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Electric Kettle Stainless",
        "description": "1.7L stainless steel electric kettle with rapid boil, auto shut-off, and boil-dry protection. Perfect for tea and coffee.",
        "price": 34.99,
        "quantity": 80,
        "category": "Home & Kitchen",
        "slug": "electric-kettle-stainless",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1579931794097-0ad001e51edb?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599669454699-248893623440?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Electric Kettle Glass",
        "description": "1.5L glass electric kettle with blue LED illumination, rapid boil, and auto shut-off. Beautiful and functional.",
        "price": 39.99,
        "quantity": 65,
        "category": "Home & Kitchen",
        "slug": "electric-kettle-glass",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1599669454699-248893623440?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1579931794097-0ad001e51edb?w=500&auto=format&fit=crop"
        ]
    },

    {
        "name": "Smart Watch Fitness Tracker",
        "description": "Advanced fitness tracker with heart rate monitor, sleep tracking, GPS, and smartphone notifications. Water-resistant and long battery life.",
        "price": 199.99,
        "quantity": 60,
        "category": "Wearable Technology",
        "slug": "smart-watch-fitness-tracker",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1434493789847-aaa0f7892be2?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Premium Smart Watch",
        "description": "Premium smartwatch with always-on display, ECG, and advanced health monitoring. Stainless steel case and interchangeable bands.",
        "price": 399.99,
        "quantity": 25,
        "category": "Wearable Technology",
        "slug": "premium-smart-watch",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop"
        ]
    },
    
    {
        "name": "Drone with 4K Camera",
        "description": "Foldable drone with 4K camera, GPS stabilization, and 30-minute flight time. Capture stunning aerial photos and videos.",
        "price": 499.99,
        "quantity": 10,
        "category": "Cameras & Photography",
        "slug": "drone-with-4k-camera",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Beginner Drone",
        "description": "Easy-to-fly beginner drone with HD camera, altitude hold, and one-key takeoff. Perfect for learning aerial photography.",
        "price": 149.99,
        "quantity": 20,
        "category": "Cameras & Photography",
        "slug": "beginner-drone",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "GoPro Hero Action Camera",
        "description": "Waterproof action camera with 4K video, hyper-smooth stabilization, and voice control. Perfect for adventures and vlogging.",
        "price": 299.99,
        "quantity": 15,
        "category": "Cameras & Photography",
        "slug": "gopro-hero-action-camera",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1529686342540-1b43aec0df75?w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1531835545299-3f10a0c6f0b0?w=500&auto=format&fit=crop"
        ]
    },
    {
        "name": "Action Camera Accessories Kit",
        "description": "Complete accessory kit for action cameras including mounts, cases, and selfie stick. Capture every angle of your adventures.",
        "price": 39.99,
        "quantity": 50,
        "category": "Cameras & Photography",
        "slug": "action-camera-accessories-kit",
        "status": "active",
        "images": [
            "https://images.unsplash.com/photo-1529686342540-1b43aec0df75?w=500&auto=format&fit=crop"
        ]
    }
]

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from product name"""
    return name.lower().replace(' ', '-').replace('&', 'and').replace("'", '')

def random_date(start_year=2023, end_year=2024):
    """Generate random datetime between start and end year"""
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    return start + timedelta(
        seconds=random.randint(0, int((end - start).total_seconds()))
    )


async def create_tables():
    """Create all tables"""
    print("📊 Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created successfully")

async def get_or_create_admin_user(db: AsyncSession):
    """Get existing admin user or create a new one"""
    print("\n👤 Checking for admin user...")
    
    result = await db.execute(
        select(User).where(
            (User.username == "HaftamuDesta") | 
            (User.email == "haftamu@gmail.com") |
            (User.role == "admin")
        )
    )
    existing_admin = result.scalar_one_or_none()
    
    if existing_admin:
        print(f"✅ Found existing admin user: {existing_admin.username} (email: {existing_admin.email})")
        return existing_admin
    print("📝 No admin user found. Creating new admin...")
    admin = User(
    username="admin",
    email="admin@example.com",
    hashed_password=pwd_context.hash("admin123"), 
    role="admin"
)
    
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    
    print(f"✅ Created new admin user: {admin.username} (email: {admin.email}, password: admin123)")
    return admin

async def seed_categories(db: AsyncSession):
    """Create categories (no slug field)"""
    print("\n📁 Creating categories...")
    result = await db.execute(select(Category))
    existing = result.scalars().all()
    
    if existing:
        print(f"✅ {len(existing)} categories already exist")
        return {cat.name: cat for cat in existing}
    
    categories = []
    for cat_data in CATEGORIES:
        category = Category(
            name=cat_data["name"],
        )
        db.add(category)
        categories.append(category)
    
    await db.commit()
    for cat in categories:
        await db.refresh(cat)
    category_map = {cat.name: cat for cat in categories}
    
    print(f"✅ Created {len(categories)} categories")
    return category_map

async def seed_products(db: AsyncSession, category_map):
    """Create products with images and include category_name in response"""
    print("\n📦 Creating products with images...")
    result = await db.execute(select(Product))
    existing = result.scalars().all()
    
    if existing:
        print(f"✅ {len(existing)} products already exist")
        return
    
    statuses = ["active", "draft", "archived"]
    status_weights = [0.85, 0.10, 0.05]  
    
    products_created = 0
    images_created = 0
    
    for product_data in PRODUCTS:
        category = category_map.get(product_data["category"])
        if not category:
            print(f"⚠️ Category '{product_data['category']}' not found, skipping")
            continue
    
        slug = product_data.get("slug") or generate_slug(product_data["name"])
        result = await db.execute(select(Product).where(Product.slug == slug))
        if result.scalar_one_or_none():
            slug = f"{slug}-{random.randint(100, 999)}"
        
        product = Product(
            name=product_data["name"],
            description=product_data["description"],
            price=product_data["price"],
            quantity=product_data["quantity"],
            slug=slug,
            status=product_data.get("status", random.choices(statuses, weights=status_weights)[0]),
            category_id=category.id,
            created_at=random_date(2023, 2024),
            updated_at=datetime.utcnow()
        )
        
        db.add(product)
        await db.flush()  
        for i, image_url in enumerate(product_data["images"]):
            thumbnail_url = image_url.replace('?w=500', '?w=150')
            
            image = ProductImage(
                product_id=product.id,
                image_url=image_url,
                thumbnail_url=thumbnail_url,
                alt_text=f"{product_data['name']} - Image {i+1}",
                is_primary=(i == 0), 
                display_order=i,
                created_at=product.created_at,
                updated_at=product.updated_at
            )
            db.add(image)
            images_created += 1
        
        products_created += 1
        print(f"  ✅ Created: {product_data['name']} (Category: {product_data['category']}) with {len(product_data['images'])} images")
    
    await db.commit()
    print(f"\n✅ Created {products_created} products with {images_created} images")

async def verify_products_with_category_names(db: AsyncSession):
    """Verify that products have category_name in response"""
    print("\n🔍 Verifying products with category names...")
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .order_by(Product.id)
    )
    products = result.scalars().unique().all()
    
    print("\n📋 Sample product responses (with category_name):")
    print("-" * 80)
    
    for i, product in enumerate(products[:5]): 
        category_name = product.category.name if product.category else None
        
        primary_image = None
        if product.primary_image:
            primary_image = {
                "id": product.primary_image.id,
                "image_url": product.primary_image.image_url,
                "thumbnail_url": product.primary_image.thumbnail_url,
                "alt_text": product.primary_image.alt_text,
                "is_primary": product.primary_image.is_primary,
                "display_order": product.primary_image.display_order
            }
        
        response = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "slug": product.slug,
            "status": product.status,
            "quantity": product.quantity,
            "category_name": category_name,
            "images": [
                {
                    "id": img.id,
                    "image_url": img.image_url,
                    "thumbnail_url": img.thumbnail_url,
                    "alt_text": img.alt_text,
                    "is_primary": img.is_primary,
                    "display_order": img.display_order
                }
                for img in product.images[:2]  
            ],
            "primary_image": primary_image
        }
        
        print(f"Product {i+1}: {response['name']}")
        print(f"  - ID: {response['id']}")
        print(f"  - Category: {response['category_name']}")
        print(f"  - Images: {len(product.images)} total")
        print(f"  - Primary Image: {response['primary_image']['image_url'] if response['primary_image'] else 'None'}")
        print()
    
    print("-" * 80)
    print(f"✅ Verified {len(products)} products with category names")

async def main():
    """Main seed function"""
    print("=" * 60)
    print("🌱 DATABASE SEEDING STARTED")
    print("=" * 60)
    
    await create_tables()
    
    async with AsyncSessionLocal() as db:
        try:
            admin = await get_or_create_admin_user(db)
            
            category_map = await seed_categories(db)
            
            await seed_products(db, category_map)
            
            await verify_products_with_category_names(db)
            
            print("\n" + "=" * 60)
            print("✅ SEEDING COMPLETED SUCCESSFULLY")
            print("=" * 60)
            print("\n📊 SUMMARY:")
            print(f"   - Admin User: {admin.username} ({admin.email})")
            
            result = await db.execute(select(func.count()).select_from(Category))
            cat_count = result.scalar()
            print(f"   - Categories: {cat_count}")
            
            result = await db.execute(select(func.count()).select_from(Product))
            prod_count = result.scalar()
            print(f"   - Products: {prod_count}")
            
            result = await db.execute(select(func.count()).select_from(ProductImage))
            img_count = result.scalar()
            print(f"   - Product Images: {img_count}")
            
            print("\n🚀 Your database is ready!")
            
        except Exception as e:
            print(f"\n❌ Error during seeding: {str(e)}")
            import traceback
            traceback.print_exc()
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(main())