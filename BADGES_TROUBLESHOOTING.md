# Troubleshooting: Badges Numerados Visíveis na Interface

## Problema
Você pode ver badges numerados (1, 2, 3, 4...) aparecendo em elementos interativos (botões, links, campos de texto) na interface do WhatsApp Formatter.

## Causa
Esses badges **NÃO são parte da aplicação**. Eles são injetados por **extensões do navegador** que adicionam atalhos de teclado, como:

- **Vimium** / **Vimium C**
- **Surfingkeys**
- **Link Hints**
- **Shortkeys**
- **Tridactyl**
- Outras extensões de navegação por teclado

## Solução

### Opção 1: Desativar a extensão temporariamente
1. Vá para as configurações de extensões do seu navegador:
   - Chrome: `chrome://extensions`
   - Firefox: `about:addons`
   - Edge: `edge://extensions`
2. Desative temporariamente a extensão de atalhos de teclado
3. Recarregue a página do WhatsApp Formatter

### Opção 2: Adicionar site à lista de exclusão
A maioria das extensões permite excluir sites específicos:

**Para Vimium:**
1. Clique com botão direito no ícone da extensão
2. Vá para "Options"
3. Em "Excluded URLs and keys", adicione: `*whatsformat*` ou a URL completa do site

**Para Surfingkeys:**
1. Abra as configurações da extensão
2. Adicione ao blacklist: `*whatsformat*`

**Para outras extensões:**
Consulte a documentação específica da extensão.

### Opção 3: CSS já está aplicado
A aplicação já inclui CSS que tenta ocultar esses badges automaticamente. Se você ainda vê os badges após recarregar a página, siga as opções 1 ou 2 acima.

## Nota para Desenvolvedores
Os badges são injetados via DOM injection pelas extensões e não fazem parte do código da aplicação. O arquivo `src/index.css` contém regras CSS para tentar ocultá-los automaticamente, mas algumas extensões podem contornar isso.

## Confirmação
Para confirmar que são badges de extensão:
1. Abra uma janela anônima/privada (sem extensões)
2. Acesse a aplicação
3. Se os badges sumirem, confirma que são da extensão
