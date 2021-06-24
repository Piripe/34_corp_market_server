interface Item {
    name: string;
    id: string;
    description: string;
    thumbnail: string;
    category: string;
    full_description: string;
}

interface ItemWithSellers {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    category: string;
    full_description: string;
    sellers: item_seller[];
}

interface item_seller {
    seller_item_id: string;
    seller_id: string;
    item_id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
}

interface delivery {
    id: string;
    client_id: string;
    deliveryman_id: string;
    items: { id: string; quantity: number }[];
    command_date: string;
    status: number;
    priority: number;
    total: number;
}

interface Seller {
    id: string;
    name: string;
    description: string;
    sold?: number;
}


interface notification {
    id: string;
    title: string;
    content: string;
    link: string;
    received: boolean;
    readed: boolean;
}
