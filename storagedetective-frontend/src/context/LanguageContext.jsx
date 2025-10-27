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
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  en: {
    app: {
      title: 'Storage Detective',
      subtitle: 'AI-Powered Item Locator',
      logout: 'Logout',
      language: 'Language'
    },
    login: {
      welcome: 'Welcome!',
      subtitle: 'Sign in to start managing your storage',
      button: 'Sign in with Google'
    },
    home: {
      subtitle: 'Find your stored items instantly with AI-powered visual search',
      upload: {
        title: 'Upload Product',
        description: 'Add new items with photos and catalog numbers'
      },
      find: {
        title: 'Find Product',
        description: 'Search by image or description using AI'
      },
      catalog: {
        title: 'Product Catalog',
        description: 'Browse and manage all your stored items'
      },
      stats: {
        title: 'Your Stats',
        items: 'Total Items',
        photos: 'Total Photos',
        storage: 'Storage',
        active: 'Active',
        loading: 'Loading...'
      }
    },
    features: {
      title: 'Powerful Features',
      ai: {
        title: 'AI-Powered Search',
        description: 'Upload a photo and find matching items instantly'
      },
      multiimage: {
        title: 'Multi-Image Support',
        description: 'Upload up to 10 photos per item for better accuracy'
      }
    },
    upload: {
      title: 'Upload New Product',
      name: 'Product Name',
      catalogNumber: 'Catalog Number (SKU)',
      description: 'Description',
      images: 'Product Images',
      takePhoto: 'Take Photo',
      chooseFromGallery: 'Choose from Gallery',
      button: 'Upload Product',
      error: 'Please enter product name and add at least one image',
      maxImages: 'Maximum 10 images allowed',
      backToHome: 'Back to Home',
      optional: 'Optional'
    },
    find: {
      title: 'Find Product',
      textQuery: 'Product Description',
      or: 'OR',
      uploadImage: 'Upload Product Image',
      takePhoto: 'Take Photo',
      chooseFromGallery: 'Choose from Gallery',
      button: 'Find Product',
      searching: 'Searching...',
      results: 'Search Results',
      searchMode: 'Search mode',
      backToHome: 'Back to Home'
    },
    catalog: {
      title: 'Product Catalog',
      count: 'products in storage',
      refresh: 'Refresh',
      empty: 'No products yet',
      uploadFirst: 'Upload Your First Product',
      edit: 'Edit',
      delete: 'Delete',
      photos: 'photos',
      backToHome: 'Back to Home'
    },
    edit: {
      title: 'Edit Product',
      name: 'Product Name',
      catalogNumber: 'Catalog Number (SKU)',
      description: 'Description',
      images: 'Product Images',
      save: 'Save Changes',
      cancel: 'Cancel',
      saving: 'Saving changes...',
      success: 'Product updated successfully!'
    },
    delete: {
      title: 'Delete Product?',
      message: 'Are you sure you want to delete',
      warning: 'This will permanently remove ALL',
      confirm: 'Yes, Delete',
      cancel: 'Cancel'
    },
    result: {
      bestMatch: 'BEST MATCH',
      similarity: 'Similarity Score',
      catalogNumber: 'SKU',
      edit: 'Edit',
      quality: {
        excellent: 'EXCELLENT',
        good: 'GOOD',
        fair: 'FAIR',
        poor: 'POOR'
      }
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      close: 'Close',
      new: 'NEW',
      of: 'of'
    },
    landing: {
      getStarted: 'Get Started',
      hero: {
        title: 'Never Lose Your Stuff Again',
        subtitle: 'AI-Powered Storage Management',
        description: 'Find anything in seconds with intelligent image search and smart organization. Perfect for homes, warehouses, and businesses.',
        cta: 'Start Free Today',
        learnMore: 'Learn More'
      },
      stats: {
        faster: 'Faster Searches',
        accuracy: 'AI Accuracy',
        items: 'Unlimited Items'
      },
      features: {
        title: 'Powerful Features',
        subtitle: 'Everything you need to organize and find your items instantly',
        ai: {
          title: 'AI-Powered Search',
          description: 'Advanced computer vision finds items from photos in seconds. Just snap and search!'
        },
        image: {
          title: 'Multi-Image Support',
          description: 'Upload up to 10 photos per item. Capture every angle for perfect identification.'
        },
        location: {
          title: 'Smart Location Tracking',
          description: 'Pin exact locations on interactive maps. Never forget where you stored something.'
        }
      },
      howItWorks: {
        title: 'How It Works',
        step1: {
          title: 'Upload & Organize',
          description: 'Take photos of your items and add them to your digital storage'
        },
        step2: {
          title: 'AI Processing',
          description: 'Our AI analyzes and indexes your items automatically'
        },
        step3: {
          title: 'Search & Find',
          description: 'Search by photo or text to find anything instantly'
        }
      },
      useCases: {
        title: 'Perfect For',
        home: {
          title: 'Home Storage',
          description: 'Organize garage, attic, basement, and closets. Find seasonal items instantly.'
        },
        business: {
          title: 'Small Business',
          description: 'Track inventory, tools, equipment, and supplies with ease.'
        },
        warehouse: {
          title: 'Warehouses',
          description: 'Manage large inventories with visual search and location tracking.'
        },
        collections: {
          title: 'Collections',
          description: 'Catalog art, collectibles, or any valuable items with detailed photos.'
        }
      },
      cta: {
        title: 'Ready to Get Organized?',
        subtitle: 'Join thousands finding their stuff faster with AI',
        button: 'Get Started Free'
      },
      footer: {
        rights: 'All rights reserved.'
      }
    }
  },
  he: {
    app: {
      title: 'בלש האחסון',
      subtitle: 'מאתר פריטים מבוסס בינה מלאכותית',
      logout: 'התנתק',
      language: 'שפה'
    },
    login: {
      welcome: '!ברוכים הבאים',
      subtitle: 'היכנס כדי להתחיל לנהל את האחסון שלך',
      button: 'התחבר עם Google'
    },
    home: {
      subtitle: 'מצא את הפריטים שלך באופן מיידי עם חיפוש ויזואלי מבוסס בינה מלאכותית',
      upload: {
        title: 'העלאת מוצר',
        description: 'הוסף פריטים חדשים עם תמונות ומספרי קטלוג'
      },
      find: {
        title: 'חיפוש מוצר',
        description: 'חפש לפי תמונה או תיאור באמצעות בינה מלאכותית'
      },
      catalog: {
        title: 'קטלוג מוצרים',
        description: 'עיין ונהל את כל הפריטים שלך'
      },
      stats: {
        title: 'הסטטיסטיקה שלך',
        items: 'סה״כ פריטים',
        photos: 'סה״כ תמונות',
        storage: 'אחסון',
        active: 'פעיל',
        loading: '...טוען'
      }
    },
    features: {
      title: 'תכונות מתקדמות',
      ai: {
        title: 'חיפוש מבוסס בינה מלאכותית',
        description: 'העלה תמונה ומצא פריטים תואמים באופן מיידי'
      },
      multiimage: {
        title: 'תמיכה במספר תמונות',
        description: 'העלה עד 10 תמונות לכל פריט לדיוק טוב יותר'
      }
    },
    upload: {
      title: 'העלאת מוצר חדש',
      name: 'שם המוצר',
      catalogNumber: 'מספר קטלוג (מק"ט)',
      description: 'תיאור',
      images: 'תמונות המוצר',
      takePhoto: 'צלם תמונה',
      chooseFromGallery: 'בחר מהגלריה',
      button: 'העלה מוצר',
      error: 'אנא מלא שם מוצר והוסף לפחות תמונה אחת',
      maxImages: 'מקסימום 10 תמונות מותר',
      backToHome: 'חזרה לדף הבית',
      optional: 'אופציונלי'
    },
    find: {
      title: 'חיפוש מוצר',
      textQuery: 'תיאור המוצר',
      or: 'או',
      uploadImage: 'העלה תמונת מוצר',
      takePhoto: 'צלם תמונה',
      chooseFromGallery: 'בחר מהגלריה',
      button: 'חפש מוצר',
      searching: '...מחפש',
      results: 'תוצאות חיפוש',
      searchMode: 'מצב חיפוש',
      backToHome: 'חזרה לדף הבית'
    },
    catalog: {
      title: 'קטלוג מוצרים',
      count: 'מוצרים באחסון',
      refresh: 'רענן',
      empty: 'אין עדיין מוצרים',
      uploadFirst: 'העלה את המוצר הראשון שלך',
      edit: 'ערוך',
      delete: 'מחק',
      photos: 'תמונות',
      backToHome: 'חזרה לדף הבית'
    },
    edit: {
      title: 'עריכת מוצר',
      name: 'שם המוצר',
      catalogNumber: 'מספר קטלוג (מק"ט)',
      description: 'תיאור',
      images: 'תמונות המוצר',
      save: 'שמור שינויים',
      cancel: 'ביטול',
      saving: '...שומר שינויים',
      success: '!המוצר עודכן בהצלחה'
    },
    delete: {
      title: '?למחוק מוצר',
      message: 'האם אתה בטוח שברצונך למחוק',
      warning: 'זה ימחק לצמיתות את כל',
      confirm: 'כן, מחק',
      cancel: 'ביטול'
    },
    result: {
      bestMatch: 'ההתאמה הטובה ביותר',
      similarity: 'ציון דמיון',
      catalogNumber: 'מק"ט',
      edit: 'ערוך',
      quality: {
        excellent: 'מצוין',
        good: 'טוב',
        fair: 'סביר',
        poor: 'חלש'
      }
    },
    common: {
      loading: '...טוען',
      error: 'שגיאה',
      success: 'הצלחה',
      close: 'סגור',
      new: 'חדש',
      of: 'מתוך'
    },
    landing: {
      getStarted: 'התחל עכשיו',
      hero: {
        title: 'לעולם לא תאבד דברים יותר',
        subtitle: 'ניהול אחסון מבוסס בינה מלאכותית',
        description: 'מצא כל דבר בשניות עם חיפוש חכם בתמונות וארגון אוטומטי. מושלם לבתים, מחסנים ועסקים.',
        cta: 'התחל חינם היום',
        learnMore: 'למד עוד'
      },
      stats: {
        faster: 'חיפושים מהירים יותר',
        accuracy: 'דיוק בינה מלאכותית',
        items: 'פריטים ללא הגבלה'
      },
      features: {
        title: 'פיצ׳רים חזקים',
        subtitle: 'כל מה שצריך לארגן ולמצוא את הפריטים שלך מיידית',
        ai: {
          title: 'חיפוש מבוסס בינה מלאכותית',
          description: 'ראייה ממוחשבת מתקדמת מוצאת פריטים מתמונות בשניות. פשוט צלם וחפש!'
        },
        image: {
          title: 'תמיכה במספר תמונות',
          description: 'העלה עד 10 תמונות לכל פריט. צלם מכל זווית לזיהוי מושלם.'
        },
        location: {
          title: 'מעקב מיקום חכם',
          description: 'סמן מיקומים מדויקים במפות אינטראקטיביות. לעולם לא תשכח איפה אחסנת משהו.'
        }
      },
      howItWorks: {
        title: 'איך זה עובד',
        step1: {
          title: 'העלה וארגן',
          description: 'צלם תמונות של הפריטים שלך והוסף אותם לאחסון הדיגיטלי'
        },
        step2: {
          title: 'עיבוד בינה מלאכותית',
          description: 'הבינה המלאכותית שלנו מנתחת ומאנדקסת את הפריטים שלך אוטומטית'
        },
        step3: {
          title: 'חפש ומצא',
          description: 'חפש לפי תמונה או טקסט כדי למצוא כל דבר מיידית'
        }
      },
      useCases: {
        title: 'מושלם עבור',
        home: {
          title: 'אחסון ביתי',
          description: 'ארגן מוסך, עליית גג, מרתף וארונות. מצא פריטים עונתיים מיידית.'
        },
        business: {
          title: 'עסק קטן',
          description: 'עקוב אחר מלאי, כלים, ציוד ואספקה בקלות.'
        },
        warehouse: {
          title: 'מחסנים',
          description: 'נהל מלאי גדול עם חיפוש חזותי ומעקב מיקום.'
        },
        collections: {
          title: 'אוספים',
          description: 'קטלג אמנות, פריטי אספנות או כל פריט יקר ערך עם תמונות מפורטות.'
        }
      },
      cta: {
        title: 'מוכן להתארגן?',
        subtitle: 'הצטרף לאלפים שמוצאים את הדברים שלהם מהר יותר עם בינה מלאכותית',
        button: 'התחל חינם'
      },
      footer: {
        rights: 'כל הזכויות שמורות.'
      }
    }
  }
};
