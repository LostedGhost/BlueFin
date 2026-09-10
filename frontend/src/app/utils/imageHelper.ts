// src/app/utils/imageHelper.ts

const API_BASE_URL = 'https://api.bluefin-immo.com';

// URL de placeholder valide
const PLACEHOLDER_IMAGE = 'https://ui-avatars.com/api/?background=00c9a7&color=fff&size=128&font-size=0.5&name=Image';

// ✅ Export de getImageUrl
export const getImageUrl = (path: any, type: 'property' | 'experience' | 'step' | 'service' = 'property'): string => {
  try {
    if (path == null) {
      return PLACEHOLDER_IMAGE;
    }

    if (typeof path === 'object') {
      const url = path.url || path.path || path.photo_url || path.image_url || path.filename;
      if (url && typeof url === 'string') {
        return getImageUrl(url, type);
      }
      return PLACEHOLDER_IMAGE;
    }

    if (typeof path === 'string') {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      
      if (path.startsWith('/storage')) {
        return `${API_BASE_URL}${path}`;
      }
      
      if (path.startsWith('storage')) {
        return `${API_BASE_URL}/${path}`;
      }
      
      if (path.startsWith('/api')) {
        return `${API_BASE_URL}${path}`;
      }
      
      // ✅ Pour les expériences, utiliser storage
      if (type === 'experience') {
        return `${API_BASE_URL}/storage/experiences/placeholder/gallery/${path}`;
      }
      
      return `${API_BASE_URL}/storage/${path}`;
    }

    return PLACEHOLDER_IMAGE;
  } catch (error) {
    console.error('❌ Erreur getImageUrl:', error);
    return PLACEHOLDER_IMAGE;
  }
};

// ✅ Export de getExperienceImages
export const getExperienceImages = (experience: any): string[] => {
  if (!experience) return [PLACEHOLDER_IMAGE];
  
  try {
    const images: string[] = [];
    
    const addImage = (path: any) => {
      if (!path) return;
      
      let url = '';
      
      if (typeof path === 'string') {
        url = path;
      } else if (typeof path === 'object') {
        url = path.url || path.path || path.image_url || path.filename || path.file;
      }
      
      if (!url) return;
      
      url = url.trim();
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!images.includes(url)) {
          images.push(url);
        }
        return;
      }
      
      let filename = url;
      if (url.includes('/')) {
        const parts = url.split('/');
        filename = parts[parts.length - 1];
      }
      
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }
      
      if (filename && experience.id) {
        const fullUrl = `${API_BASE_URL}/storage/experiences/${experience.id}/gallery/${filename}`;
        if (!images.includes(fullUrl)) {
          images.push(fullUrl);
        }
      }
    };
    
    if (experience.images && Array.isArray(experience.images)) {
      for (const img of experience.images) {
        addImage(img);
      }
    }
    
    if (experience.gallery && Array.isArray(experience.gallery)) {
      for (const img of experience.gallery) {
        addImage(img);
      }
    }
    
    if (experience.image_url) {
      addImage(experience.image_url);
    }
    
    if (experience.main_image) {
      addImage(experience.main_image);
    }
    
    if (images.length === 0) {
      images.push(`https://picsum.photos/seed/${experience.id || 'default'}/800/600`);
      images.push(`https://picsum.photos/seed/${experience.id || 'default'}-2/800/600`);
      images.push(`https://picsum.photos/seed/${experience.id || 'default'}-3/800/600`);
    }
    
    return images;
  } catch (error) {
    console.error('❌ Erreur getExperienceImages:', error);
    return [PLACEHOLDER_IMAGE];
  }
};

// ✅ Export de getFirstExperienceImage
export const getFirstExperienceImage = (experience: any): string => {
  if (!experience) return PLACEHOLDER_IMAGE;
  const images = getExperienceImages(experience);
  return images[0] || PLACEHOLDER_IMAGE;
};

// ✅ Export de getItemImages
export const getItemImages = (item: any, type: 'property' | 'experience' | 'service' = 'property'): string[] => {
  if (!item) return [PLACEHOLDER_IMAGE];
  
  try {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const urls = item.images
        .map((img: any) => {
          if (typeof img === 'string') {
            return getImageUrl(img, type);
          }
          if (img && typeof img === 'object') {
            const url = img.url || img.path || img.photo_url || img.image_url || img.filename;
            if (url && typeof url === 'string') {
              return getImageUrl(url, type);
            }
          }
          return null;
        })
        .filter(url => url && url !== '' && !url.includes('undefined'));

      if (urls.length > 0) {
        return urls;
      }
    }
    
    return [PLACEHOLDER_IMAGE];
  } catch (error) {
    console.error('❌ Erreur getItemImages:', error);
    return [PLACEHOLDER_IMAGE];
  }
};

// ✅ Export de getServiceImages
export const getServiceImages = (service: any): string[] => {
  if (!service) return [PLACEHOLDER_IMAGE];
  
  try {
    const images: string[] = [];
    
    if (service.images && Array.isArray(service.images)) {
      for (const img of service.images) {
        let url = '';
        if (typeof img === 'string') {
          url = img;
        } else if (typeof img === 'object') {
          url = img.url || img.path || img.image_url || img.filename;
        }
        
        if (url) {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            if (!images.includes(url)) images.push(url);
          } else {
            let filename = url;
            if (url.includes('/')) {
              const parts = url.split('/');
              filename = parts[parts.length - 1];
            }
            if (filename && service.id) {
              const fullUrl = `${API_BASE_URL}/storage/services/${service.id}/${filename}`;
              if (!images.includes(fullUrl)) images.push(fullUrl);
            }
          }
        }
      }
    }
    
    if (images.length === 0) {
      images.push(`https://picsum.photos/seed/${service.id || 'default'}/800/600`);
    }
    
    return images;
  } catch (error) {
    console.error('❌ Erreur getServiceImages:', error);
    return [PLACEHOLDER_IMAGE];
  }
};

// ✅ Export de getExperienceSteps
export const getExperienceSteps = (experience: any): any[] => {
  if (!experience) return [];
  
  try {
    if (experience.steps && Array.isArray(experience.steps) && experience.steps.length > 0) {
      if (typeof experience.steps[0] === 'object' && experience.steps[0] !== null) {
        return experience.steps.map((step: any) => ({
          order: step.order || step.step_order || 0,
          description: step.description || step.text || step.title || step.content || '',
          image: step.image || step.image_path || step.image_url || ''
        }));
      }
      
      return experience.steps.map((step: string, index: number) => ({
        order: index + 1,
        description: step,
        image: ''
      }));
    }
    
    return [
      { order: 1, description: `Accueil et présentation au cœur de ${experience.location || 'votre destination'}`, image: '' },
      { order: 2, description: 'Découverte de l\'histoire locale et des techniques utilisées', image: '' },
      { order: 3, description: 'Mise en pratique avec votre guide ou artisan', image: '' },
      { order: 4, description: 'Création d\'un souvenir à emporter chez vous', image: '' }
    ];
  } catch (error) {
    console.error('❌ Erreur getExperienceSteps:', error);
    return [];
  }
};

// ✅ Export de getProgramSteps
export const getProgramSteps = (experience: any): string[] => {
  if (!experience) return [];
  
  try {
    if (experience.steps && experience.steps.length > 0) {
      if (typeof experience.steps[0] === 'object') {
        return experience.steps.map((step: any) => step.description || step.text || step.title || '');
      }
      return experience.steps;
    }
    return [
      `Accueil et présentation au cœur de ${experience.location || 'votre destination'}`,
      `Découverte de l'histoire locale et des techniques utilisées`,
      `Mise en pratique avec votre guide ou artisan`,
      `Création d'un souvenir à emporter chez vous`,
    ];
  } catch (error) {
    console.error('❌ Erreur getProgramSteps:', error);
    return [];
  }
};

// ✅ Export de getAvailableDates
export const getAvailableDates = (experience: any): string[] => {
  if (!experience) return [];
  
  try {
    if (experience.availability && Array.isArray(experience.availability)) {
      const dates: string[] = [];
      for (const item of experience.availability) {
        try {
          let parsed = item;
          if (typeof item === 'string') {
            parsed = JSON.parse(item);
          }
          if (parsed && typeof parsed === 'object' && parsed.date) {
            dates.push(parsed.date);
          } else if (parsed && typeof parsed === 'object' && parsed.start_date) {
            dates.push(parsed.start_date);
          }
        } catch (e) {}
      }
      return dates;
    }
    return [];
  } catch (error) {
    console.error('❌ Erreur getAvailableDates:', error);
    return [];
  }
};

// ✅ Export de PLACEHOLDER_IMAGE
export { PLACEHOLDER_IMAGE };

// ✅ Export par défaut
export default {
  getImageUrl,
  getExperienceImages,
  getFirstExperienceImage,
  getItemImages,
  getServiceImages,
  getExperienceSteps,
  getProgramSteps,
  getAvailableDates,
  PLACEHOLDER_IMAGE
};