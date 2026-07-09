/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A valid, minimal 6-page PDF in Portuguese explaining double page layout concepts
const pdfRaw = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R 7 0 R 8 0 R] /Count 6 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> /MediaBox [0 0 595 842] /Contents 11 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> /MediaBox [0 0 595 842] /Contents 12 0 R >>
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> /MediaBox [0 0 595 842] /Contents 13 0 R >>
endobj
6 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> /MediaBox [0 0 595 842] /Contents 14 0 R >>
endobj
7 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> /MediaBox [0 0 595 842] /Contents 15 0 R >>
endobj
8 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> /MediaBox [0 0 595 842] /Contents 16 0 R >>
endobj
9 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
10 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
11 0 obj
<< /Length 580 >>
stream
BT
/F1 26 Tf
55 720 Td
(LEITOR DE PDF DUPLO) Tj
/F2 14 Tf
0 -35 Td
(Visualizacao Moderna em Dupla Pagina) Tj
/F2 12 Tf
0 -70 Td
(Bem-vindo ao Leitor de PDF Duplo!) Tj
0 -30 Td
(Este e um documento de demonstracao interativo criado para voce) Tj
0 -20 Td
(experimentar os diferentes modos de leitura lado a lado.) Tj
0 -45 Td
(Use o seletor de layout no menu superior para alternar entre:) Tj
0 -30 Td
(- Pagina Unica: visualizacao vertical tradicional de rolagem.) Tj
0 -25 Td
(- Pagina Dupla: duas paginas lado a lado (1-2, 3-4, 5-6).) Tj
0 -25 Td
(- Modo Livro: pagina 1 isolada (capa), depois pares lado a lado (2-3, 4-5).) Tj
0 -45 Td
(Outros recursos disponiveis:) Tj
0 -30 Td
(1. Painel Lateral com miniaturas dinamicas geradas em tempo real.) Tj
0 -20 Td
(2. Zoom personalizavel de 50% ate 200% ou Ajuste de Largura/Pagina.) Tj
0 -20 Td
(3. Modo Apresentacao (Tela Cheia) para leitura imersiva.) Tj
0 -20 Td
(4. Bloco de Notas para fazer anotacoes por pagina.) Tj
0 -40 Td
(Arrastar e soltar qualquer PDF nesta janela abre o seu arquivo local!) Tj
ET
endstream
endobj
12 0 obj
<< /Length 520 >>
stream
BT
/F1 20 Tf
55 720 Td
(1. O CONCEITO DE DUPLA PAGINA) Tj
/F2 13 Tf
0 -40 Td
(Aproveitando o espaco horizontal das telas modernas) Tj
/F2 11 Tf
0 -35 Td
(A leitura tradicional de PDFs em formato vertical pode ser cansativa) Tj
0 -20 Td
(e ineficiente em monitores widescreen ou tablets na horizontal.) Tj
0 -20 Td
(A visualizacao em dupla pagina (spread) resolve isso de forma elegante,) Tj
0 -20 Td
(reproduzindo exatamente a sensacao de folhear um livro real.) Tj
0 -35 Td
(Principais Beneficios:) Tj
0 -25 Td
(- Dobra o volume de informacao visivel simultaneamente na tela.) Tj
0 -20 Td
(- Excelente para materiais diagramados de forma emparelhada,) Tj
0 -20 Td
(  como portfolios, revistas, revistas em quadrinhos (HQs) e e-books.) Tj
0 -20 Td
(- Evita rolagem vertical constante, tornando a leitura mais fluida.) Tj
0 -35 Td
(Neste sistema, ao selecionar o modo Dupla Pagina, o leitor agrupa) Tj
0 -20 Td
(automaticamente os documentos em conjuntos de duas paginas para) Tj
0 -20 Td
(renderizacao paralela perfeita em alta resolucao.) Tj
ET
endstream
endobj
13 0 obj
<< /Length 540 >>
stream
BT
/F1 20 Tf
55 720 Td
(2. MODO LIVRO vs PAGINA DUPLA) Tj
/F2 13 Tf
0 -40 Td
(A importancia da simetria da diagramacao) Tj
/F2 11 Tf
0 -35 Td
(Muitas pessoas se perguntam: qual a diferenca entre o modo) Tj
0 -20 Td
(Pagina Dupla padrao e o Modo Livro?) Tj
0 -35 Td
(A diferenca esta na primeira pagina (a Capa):) Tj
0 -25 Td
(- No modo Pagina Dupla padrao, as paginas sao mostradas em pares) Tj
0 -20 Td
(  estritos: [1, 2], [3, 4], [5, 6]. Isso e util para relatorios.) Tj
0 -25 Td
(- No Modo Livro, a Pagina 1 (Capa) e renderizada sozinha,) Tj
0 -20 Td
(  centralizada na tela. As paginas seguintes sao exibidas em pares:) Tj
0 -20 Td
(  [2, 3], [4, 5], etc. Isso simula exatamente a abertura de um livro!) Tj
0 -35 Td
(Se voce ler uma revista diagramada profissionalmente sem o Modo Livro,) Tj
0 -20 Td
(a pagina esquerda e a pagina direita estarao trocadas, quebrando) Tj
0 -20 Td
(por completo a intencao de design do autor.) Tj
0 -25 Td
(Experimente mudar entre estes dois modos no painel de controle superior) Tj
0 -20 Td
(para perceber a diferenca no alinhamento das paginas!) Tj
ET
endstream
endobj
14 0 obj
<< /Length 480 >>
stream
BT
/F1 20 Tf
55 720 Td
(3. NAVEGACAO E MINIATURAS) Tj
/F2 13 Tf
0 -40 Td
(Controle total em suas maos) Tj
/F2 11 Tf
0 -35 Td
(Para facilitar a movimentacao em documentos extensos,) Tj
0 -20 Td
(o Leitor de PDF Duplo disponibiliza varias formas de navegacao:) Tj
0 -35 Td
(1. Miniaturas Dinamicas:) Tj
0 -20 Td
(   Ative a barra lateral e clique na aba de miniaturas. Cada pagina) Tj
0 -20 Td
(   sera renderizada em tamanho reduzido. Clique em qualquer uma) Tj
0 -20 Td
(   para pular instantaneamente para ela ou seu respectivo par.) Tj
0 -30 Td
(2. Controles de Teclado:) Tj
0 -20 Td
(   - Use as setas Esquerda e Direita para retroceder e avancar.) Tj
0 -20 Td
(   - Setas Cima e Baixo tambem mudam as paginas.) Tj
0 -20 Td
(   - As teclas '+' e '-' aumentam ou diminuem o zoom do documento.) Tj
0 -30 Td
(3. Caixa de Entrada de Pagina:) Tj
0 -20 Td
(   Digite o numero da pagina diretamente no campo superior e aperte) Tj
0 -20 Td
(   Enter para ir direto ao seu destino.) Tj
ET
endstream
endobj
15 0 obj
<< /Length 470 >>
stream
BT
/F1 20 Tf
55 720 Td
(4. FERRAMENTAS DE ZOOM E METADADOS) Tj
/F2 13 Tf
0 -40 Td
(Visualizacao sob medida para suas necessidades) Tj
/F2 11 Tf
0 -35 Td
(Sabemos que cada tela tem um tamanho diferente. Por isso,) Tj
0 -20 Td
(este software oferece um motor de zoom altamente preciso:) Tj
0 -30 Td
(- Ajustar Largura (Fit Width): Redimensiona a pagina para ocupar) Tj
0 -20 Td
(  todo o espaco horizontal disponivel na area de visualizacao.) Tj
0 -25 Td
(- Ajustar Pagina (Fit Page): Redimensiona a pagina para caber) Tj
0 -20 Td
(  perfeitamente na altura da tela, sem necessidade de rolagem.) Tj
0 -25 Td
(- Niveis de Zoom Fixos: De 50% ate 200% para analise de detalhes.) Tj
0 -35 Td
(Metadados do Documento:) Tj
0 -20 Td
(Na aba de Informacoes do painel lateral, voce pode ler os metadados) Tj
0 -20 Td
(criptografados no PDF, como o Nome do Criador, Software Gerador,) Tj
0 -20 Td
(Data de Criacao e as dimensoes fisicas de cada pagina em pixels.) Tj
ET
endstream
endobj
16 0 obj
<< /Length 500 >>
stream
BT
/F1 20 Tf
55 720 Td
(5. PRIVACIDADE E TECNOLOGIA) Tj
/F2 13 Tf
0 -40 Td
(Processamento 100% local e seguro) Tj
/F2 11 Tf
0 -35 Td
(Sua privacidade e nossa prioridade absoluta.) Tj
0 -25 Td
(Ao carregar um PDF pessoal (como faturas, contratos, livros ou apostilas),) Tj
0 -20 Td
(o arquivo NAO e enviado para nenhum servidor externo. Todo o processo) Tj
0 -20 Td
(de leitura, renderizacao e gerenciamento e feito localmente no seu) Tj
0 -20 Td
(proprio navegador utilizando o motor PDF.js.) Tj
0 -35 Td
(Principais Tecnologias Utilizadas:) Tj
0 -25 Td
(- React 19: Para gerenciamento de estado veloz e interface reativa.) Tj
0 -20 Td
(- Tailwind CSS 4: Estilizacao limpa, moderna, fluida e responsiva.) Tj
0 -20 Td
(- PDF.js (Mozilla): Motor oficial para renderizar PDFs em HTML Canvas.) Tj
0 -35 Td
(Fim da demonstracao. Experimente agora arrastar seus proprios PDFs) Tj
0 -20 Td
(e aproveite a melhor experiencia de leitura em dupla pagina!) Tj
0 -30 Td
(Criado com maestria no Google AI Studio Build.) Tj
ET
endstream
endobj
xref
0 17
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
000000155 00000 n 
0000000298 00000 n 
0000000441 00000 n 
0000000584 00000 n 
0000000727 00000 n 
0000000870 00000 n 
0000001013 00000 n 
0000001086 00000 n 
0000001153 00000 n 
0000001802 00000 n 
0000002391 00000 n 
0000003000 00000 n 
0000003549 00000 n 
0000004088 00000 n 
trailer
<< /Size 17 /Root 1 0 R >>
startxref
4657
%%EOF`;

/**
 * Converts the raw, multi-page PDF text to a Uint8Array.
 */
export function getSamplePdfBytes(): Uint8Array {
  const bytes = new Uint8Array(pdfRaw.length);
  for (let i = 0; i < pdfRaw.length; i++) {
    bytes[i] = pdfRaw.charCodeAt(i);
  }
  return bytes;
}
