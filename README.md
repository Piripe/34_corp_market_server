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



# Endpoints:

### GET market/items:

__Renvoie la liste de tous les items__

reponse:

```
Item[]
```


### GET market/items/id:

__Renvoie l'item en fonction de l'id donné__

id = id of item

reponse:

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

reponse (if success):

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

reponse (if success):

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

reponse (if success):

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

reponse (if success):

```
{
    success: true
}
```

### GET users/@me:

__Récupère les infos du compte actuel__

Authorization header nécessaire

reponse:

```
{
    username: string,
    id: id,
    sold: floating point number 
}
```