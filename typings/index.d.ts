interface Item {
    name: string;
    id: string;
    description: string;
    thumbnail: string;
    stack: number;
}

interface ItemWithSellers {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    sellers: item_seller[];
    stack: number;
}

interface ItemCreationOptions {
    name: string;
    description: string;
    full_description: string;
    thumbnail: string;
    price: number;
    stock: number;
    stack: number;
}

interface item_seller {
    seller_item_id: string;
    seller_id: string;
    item_id: string;
    name: string;
    description: string;
    full_description: string;
    price: number;
    stock: number;
    stack: number;
}

interface delivery {
    id: string;
    client_id: string;
    deliveryman_id: string;
    items: delivery_items[];
    command_date: string;
    status: number;
    priority: number;
    total: number;
}

interface delivery_items {
    id: string;
    quantity: number;
    price: number;
    seller_id: string;
    stack: number;
}

interface Seller {
    id: string;
    name: string;
    description: string;
    sold: number;
}

interface SellerNoSold {
    id: string;
    name: string;
    description: string;
}

interface notification {
    id: string;
    title: string;
    content: string;
    link: string;
    received: boolean;
    readed: boolean;
}

interface User {
    username: string;
    id: string;
    sold: number;
    isdeliveryman: boolean;
    workin?: string;
}
