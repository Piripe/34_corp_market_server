# Types:

### Item:

```
{
    id: id,
    name: string,
    description: string,
    thumbnail: string / url,
    sellers: Seller_Item[],
    stack: number,
    tags: string[]
}
```

### Seller_Item:

```
{
    seller_item_id: string,
    seller_id: string,
    item_id: string,
    name: string,
    description: string,
    full_description: string,
    price: number,
    stock: number,
    tags: string[]
}
```

### Notification:

```
{
    id: id,
    title: string,
    content: string,
    link: string,
    received: bool,
    readed: bool
}
```

### Account_event:

```
{
    id: id,
    date: date,
    type: account_event_type,
    data: json in terms of type
}
```

### account_event_type:

```
deposit = 0
get = 1
credit = 2
debit = 3
purchase = 4
crediFromSeller = 5
```

### Delivery:

```
{
    id: id,
    client_id: id,
    deliveryman_id: id,
    items: { id: id, quantity: number }[],
    command_date: date,
    status: nuber,
    priority: number,
    total: number,
    extra_info: string
}
```

### Seller:

```
{
    id: string,
    name: string,
    description: string,
    sold: number
}
```

### SellerNoSold:

```
{
    id: string,
    name: string,
    description: string
}
```

### ItemCreationOptions:

```
{
    name: string,
    description: string,
    full_description: string,
    thumbnail: string,
    price: number,
    stock: number,
    stack: number,
    tags: string[]
}
```

# Endpoints:

## Connexion et gestion des comptes

### POST newAccount:

**Créer un compte utilisateur**

body:

```
{
    username: string (must be a minecraft username),
    password: string,
    pikachu: pikachu
}
```

response (if success):

```
{
    success: true
}
```

### POST login:

**Récupérer le token de connection avec username + mdp**

body:

```
{
    username: string,
    password: string
}
```

response (if success):

```
{
    token: string
}
```

## Market

### GET market/items:

**Renvoie la liste de tous les items**

response:

```
Item[]
```

### GET market/items/id:

**Renvoie l'item en fonction de l'id donné**

id = id of item

response:

```
Item
```

### POST market/pay:

**Payer un vendeur**

Authorization header nécessaire

body:

```
{
    sellerId: id,
    amount: positive number
}
```

response (if success):

```
{
    success: true
}
```

### POST market/buy:

**Acheter le contenu du panier**

Authorization header nécessaire

body:

```
{
    items: [
        {
            id: seller_item_id,
            quantity: positive number
        }
    ],
    extra_info: string
}
```

response (if success):

```
{
    success: true
}
```

### POST market/items/new:

**Ajouter un nouvel item/vente**

Authorization header nécessaire

Nécessite de travailler dans une entreprise

body:

```
ItemCreationOptions
```

reponse:

```
{
    success: true,
    warn?: boolean
}
```

### PATCH market/items/stock:

**Modifie le stock de la vente**

Authorization header nécessaire

body:

```
{
    id: seller_item_id,
    stock: number
}
```

### PATCH market/items/price:

**Modifie le prix de la vente**

Authorization header nécessaire

body:

```
{
    id: seller_item_id,
    price: number
}
```

### PATCH market/items/full_description:

**Modifie la full description de la vente**

Authorization header nécessaire

body:

```
{
    id: seller_item_id,
    full_description: string
}
```

### DELETE market/items/id:

**Supprime la vente en fonction de l'id donnée**

Supprime aussi l'item si plus de vente associés

response (if success):

```
{
    success: true
}
```

## Bank

### POST bank/transfer:

**Faire un virement à un joueur**

body:

```
{
    toUser: id,
    amount: positive number
}
```

response (if success):

```
{
    success: true
}
```

## Users

### GET users/@me:

**Récupère les infos du compte actuel**

Authorization header nécessaire

response:

```
{
    username: string,
    id: id,
    sold: floating point number,
    isdeliveryman: bool
}
```

## Notifications

### GET notifications:

**Récupère les notifications**

Authorization header nécessaire

response:

```
Notification[]
```

### GET notifications/new:

**Récupère les nouvelles notifications**

Authorization header nécessaire

response:

```
Notification[]
```

### POST notifications/read:

**Marque une notification comme lue**

Authorization header nécessaire

body:

```
{
    id: id
}
```

response (if success):

```
{
    success: true
}
```

## Historique

### GET history:

**Récupère l'historique du compte**

Authorization header nécessaire

response:

```
Account_event[]
```

## Livraisons

### GET deliveries:

**Récupère les livraisons de l'utilisateur**

Authorization header nécessaire

response:

```
Delivery[]
```

### GET deliveries/toDelivery:

**Récupère les livraisons à effectuer ( status = 0 )**

Authorization header nécessaire

Nécessite d'etre livreur

response:

```
Delivery[]
```

### GET deliveries/myDelivery:

**Récupère les livraisons à effectuer et finies en temps que livreur**

Authorization header nécessaire

Nécessite d'etre livreur

reponse:

```
Delivery[]
```

### GET deliveries/slotPrice:

**Récupère le prix de la livraison par slot**

response:

```
{
    price: number
}
```

### POST deliveries/start:

**Marque la livraison comme étant livré par l'utilisateur et la passe en status 1**

Authorization header nécessaire

Nécessite d'etre livreur

body:

```
{
    id: id
}
```

response:

```
{
    success: true
}
```

### POST deliveries/setDelivered:

**Marque la livraison comme livrée**

Authorization header nécessaire

Nécessite d'etre livreur et d'avoir cette livraison a effectuer

body:

```
{
    id: id
}
```

response:

```
{
    sucess: true
}
```

### DELETE deliveries/id:

**Annule la livraison (status 0 requis)**

Authorization header nécessaire

response:

```
{
    success: bool
}
```

## Sellers

### GET sellers:

**Récupère les infos de tous les vendeurs**

response:

```
SellerNoSold[]
```

### GET sellers/@me:

**Récupère les infos de la société où l'user travail**

Authorization header nécessaire

Nécessite de travailler comme vendeur

response:

```
Seller
```

### GET sellers/id:

**Récupère les infos de la société en fonction de l'id**

Authorization header nécessaire

Le sold est renseigné si l'utilisateur travail dans l'entreprise demandé

response:

```
SellerNoSold
```

### POST sellers/pay:

**Virement vendeur - user**

Authorization header nécessaire

body:

```
{
    userId: id,
    amount: number
}
```

response:

```
{
    success: true
}
```

## Search

### GET search/q=query:

response:

```
id[]
```
