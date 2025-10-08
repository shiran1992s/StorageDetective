import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', language);
    
    // Set document direction and lang attribute
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translation dictionary
const translations = {
  en: {
    // App Header
    'app.title': 'Storage Detective',
    'app.subtitle': 'AI-Powered Item Locator',
    'app.logout': 'Logout',
    
    // Login Page
    'login.welcome': 'Welcome!',
    'login.subtitle': 'Sign in to start managing your storage',
    'login.button': 'Sign in with Google',
    
    // Main Page
    'home.welcome': 'Welcome back',
    'home.subtitle': 'Find your stored items instantly with AI-powered visual search and smart location tracking',
    'home.upload.title': 'Upload Product',
    'home.upload.description': 'Add new items with photos, descriptions, and precise locations',
    'home.find.title': 'Find Product',
    'home.find.description': 'Search by image or description using AI visual recognition',
    'home.catalog.title': 'Product Catalog',
    'home.catalog.description': 'Browse, edit, and manage all your stored items in one place',
    'home.stats.title': 'Your Stats',
    'home.stats.items': 'Total Items',
    'home.stats.photos': 'Total Photos',
    'home.stats.storage': 'Storage',
    'home.stats.active': 'Active',
    'home.stats.loading': 'Loading...',
    
    // Features Section
    'features.title': 'Powerful Features',
    'features.ai.title': 'AI-Powered Search',
    'features.ai.description': 'Upload a photo and find matching items instantly using advanced visual recognition',
    'features.location.title': 'Location Tracking',
    'features.location.description': 'Save precise Google Maps locations and navigate directly to your stored items',
    'features.multiimage.title': 'Multi-Image Support',
    'features.multiimage.description': 'Upload up to 10 photos per item for better search accuracy from any angle',
    
    // Quick Tips
    'tips.title': 'Quick Tips',
    'tips.photos': 'Take clear, well-lit photos from multiple angles for better search accuracy',
    'tips.location': 'Use specific location names like "Kitchen drawer 2" or "Garage shelf A"',
    'tips.multiple': 'Upload multiple photos (up to 10) to capture different views of your item',
    'tips.map': 'Click the Map button in search results to get directions to your items',
    
    // Upload Product Page
    'upload.title': 'Upload New Product',
    'upload.name': 'Product Name',
    'upload.name.placeholder': 'e.g., Calculator',
    'upload.description': 'Description',
    'upload.description.placeholder': 'e.g., Scientific calculator with graphing capabilities',
    'upload.location': 'Location',
    'upload.location.hint': '(Search, use current location, or click on map)',
    'upload.location.search': 'Search for a place...',
    'upload.location.current': 'Use My Current Location',
    'upload.location.selected': 'Selected Location:',
    'upload.location.coordinates': 'Coordinates',
    'upload.location.mapHint': 'Drag the marker or click on the map',
    'upload.images': 'Product Images',
    'upload.images.hint': 'Upload up to 10 images. First image will be the primary image.',
    'upload.button': 'Upload Product',
    'upload.button.uploading': 'Uploading...',
    'upload.success': 'Product uploaded successfully! Embedding will be generated automatically.',
    'upload.error': 'Please fill all fields, add at least one image, and select a location.',
    'upload.maxImages': 'Maximum 10 images allowed',
    'upload.backToHome': 'Back to Home',
    
    // Find Product Page
    'find.title': 'Find Product by Image or Description',
    'find.textQuery': 'Product Description',
    'find.textQuery.placeholder': "e.g., 'calculator', 'microwave', 'remote control'",
    'find.or': 'OR',
    'find.uploadImage': 'Upload Product Image',
    'find.button': 'Find Product',
    'find.searching': 'Searching...',
    'find.results': 'Search Results',
    'find.searchMode': 'Search mode',
    'find.backToHome': 'Back to Home',
    
    // Product Catalog Page
    'catalog.title': 'Product Catalog',
    'catalog.count': 'products in storage',
    'catalog.refresh': 'Refresh',
    'catalog.empty': 'No products yet',
    'catalog.uploadFirst': 'Upload Your First Product',
    'catalog.edit': 'Edit',
    'catalog.delete': 'Delete',
    'catalog.photos': 'photos',
    'catalog.backToHome': 'Back to Home',
    
    // Edit Product Modal
    'edit.title': 'Edit Product',
    'edit.name': 'Product Name',
    'edit.description': 'Description',
    'edit.images': 'Product Images',
    'edit.images.current': 'Current Images:',
    'edit.images.new': 'New Images (will be uploaded):',
    'edit.location': 'Location',
    'edit.coordinates': 'Current Coordinates:',
    'edit.save': 'Save Changes',
    'edit.cancel': 'Cancel',
    'edit.saving': 'Saving changes...',
    'edit.uploadingImage': 'Uploading image',
    'edit.success': 'Product updated successfully!',
    'edit.successWithEmbeddings': 'Product updated! Embeddings regenerating (~1 min)',
    
    // Delete Confirmation Modal
    'delete.title': 'Delete Product?',
    'delete.message': 'Are you sure you want to delete',
    'delete.warning': 'This will permanently remove ALL',
    'delete.warningImages': 'image(s) and the index entry.',
    'delete.confirm': 'Yes, Delete',
    'delete.cancel': 'Cancel',
    
    // Result Card
    'result.bestMatch': 'BEST MATCH',
    'result.similarity': 'Similarity Score',
    'result.map': 'Map',
    'result.edit': 'Edit',
    'result.quality.excellent': 'EXCELLENT',
    'result.quality.good': 'GOOD',
    'result.quality.fair': 'FAIR',
    'result.quality.poor': 'POOR',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.new': 'NEW',
    'common.of': 'of',
  },
  
  he: {
    // App Header
    'app.title': 'בלש האחסון',
    'app.subtitle': 'מאתר פריטים מבוסס בינה מלאכותית',
    'app.logout': 'התנתק',
    
    // Login Page
    'login.welcome': '!ברוכים הבאים',
    'login.subtitle': 'היכנס כדי להתחיל לנהל את האחסון שלך',
    'login.button': 'התחבר עם Google',
    
    // Main Page
    'home.welcome': 'שלום שוב',
    'home.subtitle': 'מצא את הפריטים שלך באופן מיידי עם חיפוש ויזואלי מבוסס בינה מלאכותית ומעקב מיקום חכם',
    'home.upload.title': 'העלאת מוצר',
    'home.upload.description': 'הוסף פריטים חדשים עם תמונות, תיאורים ומיקומים מדויקים',
    'home.find.title': 'חיפוש מוצר',
    'home.find.description': 'חפש לפי תמונה או תיאור באמצעות זיהוי ויזואלי בינה מלאכותית',
    'home.catalog.title': 'קטלוג מוצרים',
    'home.catalog.description': 'עיין, ערוך ונהל את כל הפריטים שלך במקום אחד',
    'home.stats.title': 'הסטטיסטיקה שלך',
    'home.stats.items': 'סה״כ פריטים',
    'home.stats.photos': 'סה״כ תמונות',
    'home.stats.storage': 'אחסון',
    'home.stats.active': 'פעיל',
    'home.stats.loading': '...טוען',
    
    // Features Section
    'features.title': 'תכונות מתקדמות',
    'features.ai.title': 'חיפוש מבוסס בינה מלאכותית',
    'features.ai.description': 'העלה תמונה ומצא פריטים תואמים באופן מיידי באמצעות זיהוי ויזואלי מתקדם',
    'features.location.title': 'מעקב מיקום',
    'features.location.description': 'שמור מיקומי Google Maps מדויקים ונווט ישירות לפריטים שלך',
    'features.multiimage.title': 'תמיכה במספר תמונות',
    'features.multiimage.description': 'העלה עד 10 תמונות לכל פריט לדיוק חיפוש טוב יותר מכל זווית',
    
    // Quick Tips
    'tips.title': 'טיפים מהירים',
    'tips.photos': 'צלם תמונות ברורות ומוארות היטב מזוויות שונות לדיוק חיפוש טוב יותר',
    'tips.location': 'השתמש בשמות מיקום ספציפיים כמו "מגירת מטבח 2" או "מדף מוסך A"',
    'tips.multiple': 'העלה מספר תמונות (עד 10) כדי ללכוד תצוגות שונות של הפריט שלך',
    'tips.map': 'לחץ על כפתור המפה בתוצאות החיפוש כדי לקבל הוראות הגעה לפריטים שלך',
    
    // Upload Product Page
    'upload.title': 'העלאת מוצר חדש',
    'upload.name': 'שם המוצר',
    'upload.name.placeholder': 'למשל, מחשבון',
    'upload.description': 'תיאור',
    'upload.description.placeholder': 'למשל, מחשבון מדעי עם יכולות גרפיות',
    'upload.location': 'מיקום',
    'upload.location.hint': '(חפש, השתמש במיקום הנוכחי או לחץ על המפה)',
    'upload.location.search': '...חפש מקום',
    'upload.location.current': 'השתמש במיקום הנוכחי שלי',
    'upload.location.selected': ':מיקום נבחר',
    'upload.location.coordinates': 'קואורדינטות',
    'upload.location.mapHint': 'גרור את הסמן או לחץ על המפה',
    'upload.images': 'תמונות המוצר',
    'upload.images.hint': '.העלה עד 10 תמונות. התמונה הראשונה תהיה התמונה הראשית',
    'upload.button': 'העלה מוצר',
    'upload.button.uploading': '...מעלה',
    'upload.success': '!המוצר הועלה בהצלחה! ההטמעה תיווצר אוטומטית',
    'upload.error': '.אנא מלא את כל השדות, הוסף לפחות תמונה אחת ובחר מיקום',
    'upload.maxImages': 'מקסימום 10 תמונות מותר',
    'upload.backToHome': 'חזרה לדף הבית',
    
    // Find Product Page
    'find.title': 'חיפוש מוצר לפי תמונה או תיאור',
    'find.textQuery': 'תיאור המוצר',
    'find.textQuery.placeholder': "למשל, 'מחשבון', 'מיקרוגל', 'שלט רחוק'",
    'find.or': 'או',
    'find.uploadImage': 'העלה תמונת מוצר',
    'find.button': 'חפש מוצר',
    'find.searching': '...מחפש',
    'find.results': 'תוצאות חיפוש',
    'find.searchMode': 'מצב חיפוש',
    'find.backToHome': 'חזרה לדף הבית',
    
    // Product Catalog Page
    'catalog.title': 'קטלוג מוצרים',
    'catalog.count': 'מוצרים באחסון',
    'catalog.refresh': 'רענן',
    'catalog.empty': 'אין עדיין מוצרים',
    'catalog.uploadFirst': 'העלה את המוצר הראשון שלך',
    'catalog.edit': 'ערוך',
    'catalog.delete': 'מחק',
    'catalog.photos': 'תמונות',
    'catalog.backToHome': 'חזרה לדף הבית',
    
    // Edit Product Modal
    'edit.title': 'עריכת מוצר',
    'edit.name': 'שם המוצר',
    'edit.description': 'תיאור',
    'edit.images': 'תמונות המוצר',
    'edit.images.current': ':תמונות נוכחיות',
    'edit.images.new': ':(תמונות חדשות (יועלו',
    'edit.location': 'מיקום',
    'edit.coordinates': ':קואורדינטות נוכחיות',
    'edit.save': 'שמור שינויים',
    'edit.cancel': 'ביטול',
    'edit.saving': '...שומר שינויים',
    'edit.uploadingImage': 'מעלה תמונה',
    'edit.success': '!המוצר עודכן בהצלחה',
    'edit.successWithEmbeddings': '!המוצר עודכן! ההטמעות מתעדכנות (~1 דקה)',
    
    // Delete Confirmation Modal
    'delete.title': '?למחוק מוצר',
    'delete.message': 'האם אתה בטוח שברצונך למחוק',
    'delete.warning': 'זה ימחק לצמיתות את כל',
    'delete.warningImages': '.תמונות ואת הרשומה באינדקס',
    'delete.confirm': 'כן, מחק',
    'delete.cancel': 'ביטול',
    
    // Result Card
    'result.bestMatch': 'התאמה מושלמת',
    'result.similarity': 'ציון דמיון',
    'result.map': 'מפה',
    'result.edit': 'ערוך',
    'result.quality.excellent': 'מצוין',
    'result.quality.good': 'טוב',
    'result.quality.fair': 'סביר',
    'result.quality.poor': 'חלש',
    
    // Common
    'common.loading': '...טוען',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.close': 'סגור',
    'common.new': 'חדש',
    'common.of': 'מתוך',
  }
};
