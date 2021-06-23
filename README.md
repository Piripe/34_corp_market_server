# Types:

### Item:

```
{
    category: category_id,
    description: string,
    id: id,
    name: string,
    thumbnail: string / url,
    sellers: Seller_Item[]
}
```

### Seller_Item:

```
{
    name: string,
    description: string,
    seller_id: id,
    price: number,
    seller_item_id: id,
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
    type: string,
    received: bool,
    readed: bool
}
```

### Account_event:

```
{
    id: id,
    data: data,
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
    items: { id: id, quantity: number }[],
    command_date: date,
    status: nuber
}
```

# Endpoints:

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

### GET history:

**Récupère l'historique du compte**

Authorization header nécessaire

response:

```
Account_event[]
```

### GET deliveries:

**Récupère les livraisons de l'utilisateur**

Authorization header nécessaire

response:

```
Delivery[]
```

### GET deliveries/toDelivery:

**Récupère les livraisons à effectuer ( status = 0 ) si l'utilisateur est un livreur**

Authorization header nécessaire

response:

```
Delivery[]
```

