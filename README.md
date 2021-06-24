# Types:

### Item:

```
{
    id: id,
    name: string,
    description: string,
    category: category_id,
    thumbnail: string / url,
    full_description: string,
    sellers: Seller_Item[]
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
    price: number,
    stock: number
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
    total: number
}
```

### Seller

```
{
    id: string,
    name: string,
    description: string,
    sold?: number
}
```

# Endpoints:


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
[
    {
        id: seller_item_id,
        quantity: positive number
    }
]
```

response (if success):

```
{
    success: true
}
```

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
Seller
```