**1. Introdução:**

Este projeto implementa um servidor TCP (Transmission Control Protocol) em Node.js que oferece funcionalidades de roteamento para manipulação de requisições. O sistema é composto por três módulos principais localizados no diretório 'lib' e um arquivo de configuração e execução 'server.ts'.

**2. Estrutura do Projeto:**

```lua
|-- src
|   |-- lib
|       |-- parser.ts
|       |-- response.ts
|       |-- router.ts
|   |-- server.ts
|-- static
|   |-- 404.html
|   |-- 500.html
|-- package.json
|-- tsconfig.json
```

O projeto está estruturado da seguinte forma:

- **src:**
    - **lib:**
        - **parser.ts:** Responsável por analisar e extrair informações de requisições HTTP.
        - **response.ts:** Fornece funcionalidades para criar respostas HTTP.
        - **router.ts:** Implementa um sistema de roteamento para direcionar requisições para manipuladores específicos.
- **server.ts:** Arquivo principal que configura e inicia um servidor TCP, conecta os módulos e define rotas específicas para diferentes operações.

**3. Configuração do Servidor:**

O arquivo 'server.ts' inclui a configuração do servidor TCP, como a porta, o host e o diretório raiz para manipulação de arquivos.

```tsx
const porta = Number(process.env.PORT) || 8080;
const host = process.env.ADDRESS || '0.0.0.0';
const root_dir = process.env.ROOT || '/home/scorel/Documents'

```

**4. Módulos:**

- **parser.ts:** Este módulo analisa requisições HTTP, extrai informações relevantes e retorna um objeto estruturado.
- **response.ts:** Fornece funcionalidades para criar respostas HTTP, incluindo suporte para envio de arquivos, texto, JSON, entre outros.
- **router.ts:** Implementa um sistema de roteamento que associa caminhos de requisição a manipuladores específicos. Ele também gerencia rotas estáticas para servir arquivos.

**5. Funcionalidades Principais:**

- **Roteamento:** O módulo de roteamento ('router.ts') direciona requisições HTTP para manipuladores específicos com base na URL e no método HTTP.
- **Serviço Estático:** Arquivos estáticos são servidos a partir dos diretórios '/storage' e '/'.
- **Listagem de Arquivos:** Rota '/files' para listar arquivos e pastas no diretório raiz ou em um subdiretório específico.
- **Criação de Pasta:** Rota '/folder' para criar uma nova pasta no diretório raiz.
- **Upload de Arquivo:** Rota '/upload' permite o upload de arquivos para o servidor.
- **Download de Arquivo:** Rota '/download' para baixar arquivos do servidor.
- **Exclusão de Arquivos/Pastas:** Rota '/files' para excluir arquivos ou pastas.

**6. Execução do Servidor:**

O servidor é iniciado ao executar o arquivo 'server.ts'. É possível configurar opções como a porta, o host e o diretório raiz por meio de variáveis de ambiente.

```bash
# Exemplo de execução com variáveis de ambiente
PORT=8080 ADDRESS=0.0.0.0 ROOT=/caminho/do/diretorio yarn start

```

**7. Detalhando o funcionamento:**

Começando pelo código do arquivo `parser.ts` e seus métodos utilizados:

```tsx
import { IParserdRequest, IHeaders, IParsedResponse, BodyBuffer } from '../types'

const top_header_rgx = /(CONNEC|DELETE|GET|HEAD|OPTIONS|POST|PUT|PATCH|ALL) ([\\S]+) (HTTP\\/1\\.1)/i

export function parseRequest(payload: Buffer): IParserdRequest | undefined {
	// Implementação detalhada...
}

```

### `parseRequest` Function:

```tsx
// 1. Verificação da Existência do Corpo:
const hasBody = payload.includes(Buffer.from('\\\\r\\\\n\\\\r\\\\n'));

// 2. Extração dos Cabeçalhos e Corpo:
const body_break = hasBody && payload.indexOf(Buffer.from('\\\\r\\\\n\\\\r\\\\n'));
const raw_headers = hasBody ? payload.subarray(0, body_break).toString() : payload.toString();

// 3. Validação da Requisição:
// Utiliza uma expressão regular para validar a primeira linha dos cabeçalhos da requisição.
const isValidRequest = top_header_rgx.test(raw_headers.split('\\\\r\\\\n')[0]);

// 4. Extração de Componentes da Requisição:
// Extrai informações como método, URL, caminho, parâmetros, cabeçalhos e corpo da requisição.
const raw_body = body_break && payload.subarray(body_break + 4);

// 5. Conversão de Dados e Construção do Objeto `IParserdRequest`:
// Converte os dados extraídos para os tipos apropriados e constrói o objeto `IParserdRequest`.
// Trata casos específicos, como requisições com corpo "chunked" ou com cabeçalho "content-length".
let body: BodyBuffer = undefined;
if (hasBody) {
  if (headers['poli-file'] === 'chunked') {
    body = new BodyBuffer(raw_body);
  } else if (Number.isInteger(headers['content-length'])) {
    body = new BodyBuffer(headers['content-length'] as number);
    body.add(raw_body);
  }
}

// 6. Retorno da Requisição Analisada:
// Retorna a requisição analisada como um objeto do tipo `IParserdRequest`
// ou `undefined` se a requisição não for válida.
if (isValidRequest) {
  return {
    method,
    path,
    headers,
    params,
    body,
  };
} else {
  return undefined;
}

```

O arquivo `response.ts` contém a implementação das funções relacionadas à resposta da requisição:

```tsx
import { Socket } from 'node:net';
import { IResponse } from '../types';
import { createReadStream, lstatSync } from 'fs';
import * as mime from 'mime-types';
import { ReadableByteStreamController, ReadableStream } from 'stream/web';

// Função que cria e retorna um objeto de resposta
export function _response(socket: Socket): IResponse {
  return {
    // Propriedades do objeto de resposta
    headers: {},
    socket,

    // Método para configurar um cabeçalho na resposta
    setHeader(name: string, value: any) {
      // Implementação detalhada...
    },

    // Métodos para escrever dados na resposta (bytes, texto, JSON)
    bytes(data: Buffer) {
      // Implementação detalhada...
    },
    text(data: string) {
      // Implementação detalhada...
    },
    json(data: any) {
      // Implementação detalhada...
    },

    // Método para enviar a resposta
    send(status = 200) {
      // Implementação detalhada...
    },

    // Método para lidar com arquivos na resposta
    file(path: string, type?: string) {
      // Implementação detalhada...
    },
  };
}

```

- A função `_response` retorna um objeto que representa uma resposta HTTP.
- O objeto de resposta possui métodos para configurar cabeçalhos, escrever dados (bytes, texto, JSON), enviar a resposta e lidar com arquivos.
- A função `file` é utilizada para enviar um arquivo na resposta, configurando o tipo MIME e o tamanho do conteúdo automaticamente.

### `send` Function:

O método **`send`** é responsavel por enviar a respota da seguinte forma:

```tsx
// Método `send(status?: number): void` em response.ts

// Este método é responsável por enviar a resposta para o cliente.

// 1. Configuração de Cabeçalhos Padrão:
this.setHeader('connection', 'Closed'); // Define a conexão como "Closed".

const to_write = this.body || this.buffer;
if (to_write && !this.headers['content-length']) { // Se houver dados para escrever e o cabeçalho "content-length" não estiver definido.
  this.setHeader('content-length', Buffer.byteLength(to_write)); // calcula o comprimento dos dados.
}

// 2. Escrita da Resposta no Socket:
this.socket.write(`HTTP/1.1 ${status || 200}\\r\\n`);  // Escreve a linha de status no socket.
Object.keys(this.headers).forEach(key => {
  this.socket.write(`${key}: ${this.headers[key]}\\r\\n`);  // Escreve cada cabeçalho no socket.
});
this.socket.write('\\r\\n');  // Adiciona uma linha em branco para indicar o fim dos cabeçalhos.
if (this.file_path) {
  try {
    const stream = createReadStream(String(this.file_path), { highWaterMark: 64 * 1024 }); // cria uma stream de leitura com tamanho de chunk de 64KB
    stream.pipe(socket);  // Se houver um caminho de arquivo definido, cria um stream de leitura e o envia para o socket.
  } catch (error) {
    console.error(error);
    socket.destroy(error);
  }
} else if (to_write) {
  this.socket.write(Buffer.from(to_write)) && this.socket.end();  // Se houver dados para escrever, os escreve no socket.
} else {
  this.socket.end();  // Finaliza a conexão.
}

```

No arquivo `server.ts` contém a implementação das funções principais do servidor e está estruturado da seguinte forma:

```tsx
// server.ts

// Importações necessárias
import * as net from 'net';
import { router } from './lib/router'
import * as path from 'path';
import { createWriteStream, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, rmdirSync, writeFileSync } from 'fs';

// Configuração de parâmetros
const port = Number(process.env.PORT) || 8080;
const host = process.env.ADDRESS || '0.0.0.0';
const root_dir = process.env.ROOT || '/home/scorel/Documents'

// Criação do servidor TCP
const server = net.createServer();

// Inicialização do servidor na porta especificada
server.listen(port, host, () => {
  console.log('Server is running on port ' + port + '.');
});

// Inicia o roteador para lidar com as requisições
router.startRouter(server);

// Configuração de rotas estáticas para acesso a arquivos
router.static('/storage', root_dir)
router.static('/', path.resolve('static'))

// Rota para listar arquivos
router.get('/files', (req, res) => {
  // Lógica para listar arquivos e diretórios
  // ...
})

// Rota para criar diretório
router.post('/folder', (req, res) => {
  // Lógica para criar diretório
  // ...
})

// Rota para upload de arquivos
router.all('/upload', async (req, res) => {
  // Lógica para upload de arquivos
  // ...
})

// Rota para download de arquivos
router.get('/download', async (req, res) => {
  // Lógica para download de arquivos
  // ...
})

// Rota para exclusão de arquivos
router.delete('/files', (req, res) => {
  // Lógica para exclusão de arquivos
  // ...
})

```

Dessa forma podemos ter um fluxo de trabalho parecido com esse: 

8**. Conclusão:**

Este projeto oferece um servidor TCP configurável com funcionalidades robustas de roteamento, manipulação de arquivos e suporte a várias operações HTTP. Ele pode ser adaptado e expandido para atender a requisitos específicos de outros projetos.