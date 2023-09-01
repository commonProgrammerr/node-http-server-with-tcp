# Projeto de redes - Server HTTP

> Linha adicional de texto informativo sobre o que o projeto faz. Sua introdução deve ter cerca de 2 ou 3 linhas. Não exagere, as pessoas não vão ler.

## 💻 Pré-requisitos

Antes de começar, verifique se você atendeu aos seguintes requisitos:

- Você instalou a versão mais recente do `Nodejs` com `npm`
- Você tem uma máquina com `Windows` ou `Linux` instalado
- Clique [aqui](https://nodejs.org/en/download) para instalar `Nodejs`.

## 🚀 Instalando Server HTTP

Para instalar o Server HTTP, execute no terminal:

```
git clone https://github.com/commonProgrammerr/node-http-server-with-tcp
cd node-http-server-with-tcp
npm install
```

## ☕ Iniciando o Server HTTP

Para usar o Server HTTP, execute no terminal:

```
cd node-http-server-with-tcp
npm run start:server
```

ou

```
cd node-http-server-with-tcp
npm run build
node ./build/server.bundle.js
```

## ☕ Usando o Client HTTP

Para usar o Client HTTP, execute no terminal:

```
cd node-http-server-with-tcp
npm run client
```

ou

```
cd node-http-server-with-tcp
npm run dev:client
```

## 💻 Sobre o servidor

O servidor atualmente só aceita requisições na root path `/` e possui as seguintes funcionalidades:

- `GET`
  - Retorna todos os itens savos em cache caso nenhum id tenha sido especificado
  - Caso especificado um id no seguinte formato `http://<server_address>/?id=<id_item>` retorna o item com o id passado
  - No caso do item não existir o servidor retorna status 404
- `POST`
  - Salva um novo o item em cache, caso o id não seja fornecido o item é salvo com um id numerico incremental
  - Caso especificado um id no seguinte formato `http://<server_address>/?id=<id_item>` salva o item com o id passado
  - No caso do item não ser um objeto JSON o servidor retorna status 400
- `PUT`
  - Salva o item passado sobrescrevendo-o em cache, caso especificado um id no seguinte formato `http://<server_address>/?id=<id_item>`
  - No caso do item não ser um objeto JSON o servidor retorna status 400
  - No caso do item não existir o servidor retorna status 404
- `DELETE`
  - Remove o item com o id passado do cache, id deve ser passado no seguinte formato `http://<server_address>/?id=<id_item>`
  - No caso do item não existir o servidor retorna status 404
