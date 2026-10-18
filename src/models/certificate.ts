import forge from 'node-forge';

export class Certificate {

    private pfx: forge.pkcs12.Pkcs12Pfx;

    /**
     * Decriptografa e converte um buffer de um arquivo PFX (.p12/.pfx) em um objeto interpretável.
     * 
     * @param certBuffer - O buffer contendo o arquivo PFX lido.
     * @param password - A senha do certificado digital.
     */
    constructor(certBuffer: Buffer, password: string) {
        const pfxAsn1 = forge.asn1.fromDer(certBuffer.toString('binary'));
        this.pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);
    }

    /**
     * Extrai a chave privada de um objeto PFX decriptografado.
     * Retorna a chave no formato PEM original, mantendo os cabeçalhos BEGIN e END.
     * 
     * @returns A string da chave privada no formato PEM completo.
     * @throws {Error} Lança um erro se nenhuma chave privada for encontrada no arquivo.
     */
    extractPrivateKey(): string {
        const keyBag = this.pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag! })[forge.pki.oids.pkcs8ShroudedKeyBag!];
    
        if (!keyBag) 
            throw new Error('Private key not found');

        return forge.pki.privateKeyToPem(keyBag[0]!.key!);
    }

    /**
     * Extrai o certificado público de um objeto PFX e o limpa para uso em transmissões externas.
     * Remove os cabeçalhos BEGIN, END e todas as quebras de linha/espaços, entregando apenas o Base64 puro.
     * Formato obrigatório para embutir na tag <X509Certificate> em assinaturas XML (XMLDSig, Notas Fiscais, etc).
     * 
     * @returns O conteúdo do certificado público em Base64 contínuo e limpo.
     * @throws {Error} Lança um erro se nenhum certificado público for encontrado no arquivo.
     */
    extractPublicCert(): string {
        const certbag = this.pfx.getBags({ bagType: forge.pki.oids.certBag! })[forge.pki.oids.certBag!];

        if (!certbag)
            throw new Error('Public certificate not found');

        return forge.pki.certificateToPem(certbag[0]!.cert!)
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .replace(/\s+/g, '');
    }
}