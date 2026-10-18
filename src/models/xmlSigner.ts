import type { Certificate } from "@/models/certificate.js";
import { DOMParser, Document as DOMXMLDocument } from "@xmldom/xmldom";
import { SignedXml } from "xml-crypto";

/**
 * URIs para o Algoritmo de Assinatura (Signature Algorithm)
 * Informa como a chave RSA criptografa o hash final.
 */
export enum SignatureAlgorithm {
    SHA1 = "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
}

interface TargetNodeToSign {
    nodeId: string;
    location: SignatureLocation;
}

type SignatureLocation = 'self' | 'parent';

export class XmlSigner {

    private static readonly SIGNATURE_RULES: Record<string, SignatureLocation> = {
        InfRps: 'self',
        InfPedidoCancelamento: 'self',
        InfSubstituicaoNfse: 'self',
        ConsultarNfseRpsEnvio: 'self',
        infDPS: 'parent',
        InfDeclaracaoPrestacaoServico: 'parent',
        LoteRps: 'parent',
        EnviarLoteRpsEnvio: 'parent',
        EnviarLoteRpsSincronoEnvio: 'parent',
        ConsultarNfseServicoPrestadoEnvio: 'parent',
        ConsultarNfseServicoTomadoEnvio: 'parent',
        ConsultarNfseFaixaEnvio: 'parent',
    }
    
    private certificate: Certificate;
    private defaultAlgorithm: SignatureAlgorithm;

    constructor(certificate: Certificate, defaultAlgorithm = SignatureAlgorithm.SHA256) {
        this.certificate = certificate;
        this.defaultAlgorithm = defaultAlgorithm;
    }

    /**
     * Aplica a assinatura digital XMLDSig nos nós identificados do documento XML.
     * 
     * @param xml - A string contendo a estrutura XML original a ser assinada.
     * @returns A string do XML final contendo o(s) nó(s) de assinatura <Signature> injetado(s).
     * @throws {Error} Lança um erro caso nenhuma tag mapeada com atributo 'Id' seja localizada.
     */
    sign(xml: string): string {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const targets = this.findSignableNodes(doc);
    
        if (targets.length === 0)
            throw new Error ("Tags not found for signature");
        
        const digestAlgorithm = this.defaultAlgorithm === SignatureAlgorithm.SHA256
            ? 'http://www.w3.org/2001/04/xmlenc#sha256'
            : 'http://www.w3.org/2000/09/xmldsig#sha1';

        const privateKeyPem = this.certificate.extractPrivateKey();
        const publicCertPem = this.certificate.extractPublicCert();
    
        let currentXml = xml;
    
        for (const target of targets) {
            const sig = new SignedXml({ 
                privateKey: privateKeyPem, 
                publicCert: publicCertPem, 
                signatureAlgorithm: this.defaultAlgorithm 
            });
    
            sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    
            sig.getKeyInfoContent = () => {
                return `<X509Data><X509Certificate>${publicCertPem}</X509Certificate></X509Data>`;
            }
    
            const xpath = `//*[@Id='${target.nodeId}' or @id='${target.nodeId}']`;
    
            sig.addReference({
                xpath: xpath,
                digestAlgorithm: digestAlgorithm,
                transforms: [
                    'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
                    'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
                ]
            });
    
            sig.computeSignature(currentXml, {
                location: {
                    reference: xpath,
                    action: target.location === 'parent' ? 'after' : 'append'
                }
            });
    
            currentXml = sig.getSignedXml();
        }
    
        return currentXml;
    }

    /**
     * Percorre o documento XML buscando as tags mapeadas em SIGNATURE_RULES que contenham o atributo 'Id'.
     * 
     * @param xml - O documento XML instanciado como DOMXMLDocument.
     * @returns Um array contendo o ID do nó encontrado e sua respectiva localização de assinatura ('self' ou 'parent').
     */
    findSignableNodes(xml: DOMXMLDocument): TargetNodeToSign[] {
        const targets: TargetNodeToSign[] = [];

        for (const [tagName, location] of Object.entries(XmlSigner.SIGNATURE_RULES)) {
            const elements = xml.getElementsByTagName(tagName);
            
            for (let i = 0; i < elements.length; i++) {
                const id = elements.item(i)?.getAttribute('Id') || elements.item(i)?.getAttribute('id');
                if (id) {
                    targets.push({ nodeId: id, location });
                }
            }
        }

        return targets;
    }
}