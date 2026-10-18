import { Certificate } from '@/models/certificate.js';
import { SignatureAlgorithm, XmlSigner } from '@/models/xmlSigner.js';
import express, { type Request, type Response } from 'express';
import multer from 'multer';

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Salvar temporariamente o arquivo na memória.
const upload = multer({ storage: multer.memoryStorage() });

app.post('/assinar', upload.single('certFile'), (req: Request, res: Response) => {
    const { password, algorithm, xml } = req.body;
    const certFile = req.file;

    if (!certFile || !password || !xml) {
        return res.status(400).json({ success: false, error: 'Parâmetros obrigatórios ausentes.' });
    }

    const selectedAlgorithm = algorithm === SignatureAlgorithm.SHA256 
                ? SignatureAlgorithm.SHA256
                : SignatureAlgorithm.SHA1;

    const certificate = new Certificate(certFile.buffer, password);
    const xmlSigner = new XmlSigner(certificate, selectedAlgorithm);
    const signedXml = xmlSigner.sign(xml);

    res.json({ success: true, signedXml });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
