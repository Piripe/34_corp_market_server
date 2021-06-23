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

# Endpoints:

### GET market/items:

__Renvoie la liste de tous les items__

response:

```
Item[]
```


### GET market/items/id:

__Renvoie l'item en fonction de l'id donné__

id = id of item

response:

```
Item
```


### POST market/pay:

__Payer un vendeur__

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

__Acheter le contenu du panier__

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

__Créer un compte utilisateur__

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

__Récupérer le token de connection avec username + mdp__

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

__Faire un virement à un joueur__

body:

````
{
    toUser: id,
    amount: positive number
}
````

response (if success):

```
{
    success: true
}
```

### GET users/@me:

__Récupère les infos du compte actuel__

Authorization header nécessaire

response:

```
{
    username: string,
    id: id,
    sold: floating point number 
}
```


### GET notifications:

__Récupère les notifications__

Authorization header nécessaire

response:

```
Notification[]
```

### GET notifications/new:

__Récupère les nouvelles notifications__

Authorization header nécessaire

response:

```
Notification[]
```


### POST notifications/read:

__Marque une notification comme lue__

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

__Récupère l'historique du compte__

Authorization header nécessaire

response:

```
Account_event[]
```