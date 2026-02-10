const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        return `http://${hostname}:8000/api/v1`;
    }
    return 'http://localhost:8000/api/v1';
};

const BASE_URL = getBaseUrl();

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
    }

    const data = await response.json();

    // Helper to normalize image URLs
    const normalizeImage = (imgUrl: string) => {
        if (!imgUrl) return null;

        const backendBase = BASE_URL.replace('/api/v1', '');

        if (imgUrl.startsWith('http')) {
            const currentHost = backendBase.replace('http://', '').replace('https://', '');
            // Replace various internal hosts with the actual current host
            return imgUrl
                .replace('localhost:8000', currentHost)
                .replace('127.0.0.1:8000', currentHost)
                .replace('localhost', currentHost.split(':')[0])
                .replace('127.0.0.1', currentHost.split(':')[0]);
        }

        // Prepend backend URL for relative paths
        return `${backendBase}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
    };

    // Transform data if it's a product list or single product
    if (Array.isArray(data)) {
        return data.map(item => ({
            ...item,
            image_url: normalizeImage(item.image_url),
            gallery: Array.isArray(item.gallery) ? item.gallery.map(normalizeImage) : item.gallery
        }));
    } else if (data && typeof data === 'object') {
        if (data.results && Array.isArray(data.results)) {
            data.results = data.results.map((item: any) => ({
                ...item,
                image_url: normalizeImage(item.image_url),
                gallery: Array.isArray(item.gallery) ? item.gallery.map(normalizeImage) : item.gallery
            }));
        } else {
            if (data.image_url) data.image_url = normalizeImage(data.image_url);
            if (Array.isArray(data.gallery)) data.gallery = data.gallery.map(normalizeImage);
        }
    }

    return data;
}

export const api = {
    products: {
        list: (category?: string) => {
            const query = category ? `?category=${category}` : '';
            return fetchApi(`/products/${query}`);
        },
        get: (id: string | number) => fetchApi(`/products/${id}/`),
        toggleLike: (id: string | number, userId: string) =>
            fetchApi(`/products/${id}/toggle_like/`, {
                method: 'POST',
                body: JSON.stringify({ user_id: userId }),
            }),
    },
    events: {
        list: () => fetchApi('/events/'),
        get: (slug: string) => fetchApi(`/events/${slug}/`),
    },
    comments: {
        list: (productId: number) => fetchApi(`/comments/?product_id=${productId}`),
        create: (data: any) => fetchApi('/comments/', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    contact: {
        list: () => fetchApi('/contact/'),
    },
    auth: {
        login: (credentials: any) => fetchApi('/login/', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        logout: () => fetchApi('/logout/', { method: 'POST' }),
        me: () => fetchApi('/me/'),
    }
};
