# cipher-nfse

Uma ferramenta simples e eficiente em Node.js/TypeScript para **assinar digitalmente arquivos XML de NFSe** (Nota Fiscal de Serviço Eletrônica) usando criptografia padrão **XML-DSIG**.

O motor processa o XML, localiza automaticamente as tags assináveis e injeta a assinatura criptográfica utilizando **Certificados Digitais padrão A1 (.pfx / .p12)**.


## 🚀 Recursos Principais

- **Assinatura de NFSe:** Suporte nativo para múltiplos padrões (ABRASF / Nacional) de mapeamento (InfRps, LoteRps, infDPS, etc.).
- **Suporte Criptográfico:** Assinatura com algoritmos `RSA-SHA256` ou `RSA-SHA1`.
- **Certificado A1 em Memória:** Extração segura da chave privada e certificado público em Base64 através da biblioteca `node-forge`.
- **API Pronta:** Endpoint HTTP integrado via Express para envio de arquivos e strings XML.

## 🛠️ Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 18 ou superior recomendada)
- Um certificado digital **padrão A1** válido (arquivo `.pfx` ou `.p12`)

## 📦 Instalação e Execução

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Inicie o servidor Express:
   ```bash
   npm run dev
   ```
   *O servidor estará rodando em `http://localhost:3000`.*

## 💻 Como Usar (Endpoint API)

O servidor disponibiliza uma rota pronta para receber o formulário do seu HTML.

### Endpoint: `POST /assinar`
**Content-Type:** `multipart/form-data`

#### Parâmetros do Formulário:
- `certFile`: O arquivo físico do seu certificado digital A1 (`.pfx` ou `.p12`).
- `password`: A senha secreta do certificado.
- `xml`: A string de texto contendo todo o conteúdo do XML que você deseja assinar.
- `algorithm`: *(Opcional)* Defina o algoritmo de hash desejado (`http://www.w3.org/2001/04/xmldsig-more#rsa-sha256` ou `http://www.w3.org/2000/09/xmldsig#rsa-sha1`). O padrão é SHA256.

#### Exemplo de Resposta (JSON):
```json
{
  "success": true,
  "signedXml": "<EnviarLoteRpsEnvio>...<Signature>...</Signature></EnviarLoteRpsEnvio>"
}
```


## 🔒 Segurança Importante

O servidor Express foi configurado para utilizar `multer.memoryStorage()`. Isso significa que o seu certificado **nunca é salvo no disco rígido do servidor**, sendo processado inteiramente na memória RAM e descartado logo após o término da requisição HTTP.

## 📄 Licença

Este projeto está sob a licença MIT.