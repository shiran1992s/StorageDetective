const translations = {
    en: {
        // Navigation
        langToggle: '🇮🇱 עברית',
        getStarted: 'Get Started',
        
        // Hero
        heroTitle: 'Never Lose Your Stuff Again',
        heroSubtitle: 'AI-Powered Storage Management',
        heroDescription: 'Find anything in seconds with intelligent image search and smart organization. Perfect for homes, warehouses, and businesses.',
        heroCTA: '🚀 Start Free Today',
        learnMore: 'Learn More',
        
        // Stats
        stat1Value: '10x',
        stat1Label: 'Faster Searches',
        stat2Value: '95%',
        stat2Label: 'AI Accuracy',
        stat3Value: '∞',
        stat3Label: 'Unlimited Items',
        
        // Features
        featuresTitle: 'Powerful Features',
        featuresSubtitle: 'Everything you need to organize and find your items instantly',
        feature1Title: 'AI-Powered Search',
        feature1Desc: 'Advanced computer vision finds items from photos in seconds. Just snap and search!',
        feature2Title: 'Multi-Image Support',
        feature2Desc: 'Upload up to 10 photos per item. Capture every angle for perfect identification.',
        feature3Title: 'Smart Location Tracking',
        feature3Desc: 'Pin exact locations on interactive maps. Never forget where you stored something.',
        
        // How It Works
        howTitle: 'How It Works',
        step1Title: 'Upload & Organize',
        step1Desc: 'Take photos of your items and add them to your digital storage',
        step2Title: 'AI Processing',
        step2Desc: 'Our AI analyzes and indexes your items automatically',
        step3Title: 'Search & Find',
        step3Desc: 'Search by photo or text to find anything instantly',
        
        // Use Cases
        useCasesTitle: 'Perfect For',
        useCase1Title: 'Home Storage',
        useCase1Desc: 'Organize garage, attic, basement, and closets. Find seasonal items instantly.',
        useCase2Title: 'Small Business',
        useCase2Desc: 'Track inventory, tools, equipment, and supplies with ease.',
        useCase3Title: 'Warehouses',
        useCase3Desc: 'Manage large inventories with visual search and location tracking.',
        useCase4Title: 'Collections',
        useCase4Desc: 'Catalog art, collectibles, or any valuable items with detailed photos.',
        
        // CTA
        ctaTitle: 'Ready to Get Organized?',
        ctaSubtitle: 'Join thousands finding their stuff faster with AI',
        ctaButton: 'Get Started Free →',
        
        // Footer
        footerRights: '© 2025 Storage Detective. All rights reserved.'
    },
    he: {
        // Navigation
        langToggle: '🇺🇸 English',
        getStarted: 'התחל עכשיו',
        
        // Hero
        heroTitle: 'לעולם לא תאבד דברים יותר',
        heroSubtitle: 'ניהול אחסון מבוסס בינה מלאכותית',
        heroDescription: 'מצא כל דבר בשניות עם חיפוש חכם בתמונות וארגון אוטומטי. מושלם לבתים, מחסנים ועסקים.',
        heroCTA: '🚀 התחל חינם היום',
        learnMore: 'למד עוד',
        
        // Stats
        stat1Value: '10x',
        stat1Label: 'חיפושים מהירים יותר',
        stat2Value: '95%',
        stat2Label: 'דיוק בינה מלאכותית',
        stat3Value: '∞',
        stat3Label: 'פריטים ללא הגבלה',
        
        // Features
        featuresTitle: 'פיצ׳רים חזקים',
        featuresSubtitle: 'כל מה שצריך לארגן ולמצוא את הפריטים שלך מיידית',
        feature1Title: 'חיפוש מבוסס בינה מלאכותית',
        feature1Desc: 'ראייה ממוחשבת מתקדמת מוצאת פריטים מתמונות בשניות. פשוט צלם וחפש!',
        feature2Title: 'תמיכה במספר תמונות',
        feature2Desc: 'העלה עד 10 תמונות לכל פריט. צלם מכל זווית לזיהוי מושלם.',
        feature3Title: 'מעקב מיקום חכם',
        feature3Desc: 'סמן מיקומים מדויקים במפות אינטראקטיביות. לעולם לא תשכח איפה אחסנת משהו.',
        
        // How It Works
        howTitle: 'איך זה עובד',
        step1Title: 'העלה וארגן',
        step1Desc: 'צלם תמונות של הפריטים שלך והוסף אותם לאחסון הדיגיטלי',
        step2Title: 'עיבוד בינה מלאכותית',
        step2Desc: 'הבינה המלאכותית שלנו מנתחת ומאנדקסת את הפריטים שלך אוטומטית',
        step3Title: 'חפש ומצא',
        step3Desc: 'חפש לפי תמונה או טקסט כדי למצוא כל דבר מיידית',
        
        // Use Cases
        useCasesTitle: 'מושלם עבור',
        useCase1Title: 'אחסון ביתי',
        useCase1Desc: 'ארגן מוסך, עליית גג, מרתף וארונות. מצא פריטים עונתיים מיידית.',
        useCase2Title: 'עסק קטן',
        useCase2Desc: 'עקוב אחר מלאי, כלים, ציוד ואספקה בקלות.',
        useCase3Title: 'מחסנים',
        useCase3Desc: 'נהל מלאי גדול עם חיפוש חזותי ומעקב מיקום.',
        useCase4Title: 'אוספים',
        useCase4Desc: 'קטלג אמנות, פריטי אספנות או כל פריט יקר ערך עם תמונות מפורטות.',
        
        // CTA
        ctaTitle: 'מוכן להתארגן?',
        ctaSubtitle: 'הצטרף לאלפים שמוצאים את הדברים שלהם מהר יותר עם בינה מלאכותית',
        ctaButton: 'התחל חינם ←',
        
        // Footer
        footerRights: '© 2025 בלש האחסון. כל הזכויות שמורות.'
    }
};

// Current language
let currentLang = localStorage.getItem('lang') || 'en';

// Update all text content
function updateContent() {
    const t = translations[currentLang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
    
    // Update HTML direction
    document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    // Save preference
    localStorage.setItem('lang', currentLang);
}

// Language toggle button handler
document.getElementById('langToggle').addEventListener('click', function() {
    currentLang = currentLang === 'en' ? 'he' : 'en';
    updateContent();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateContent();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});