const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 1. Ponto de entrada: qual é o arquivo principal da aplicação
  entry: './script.js',

  // 2. Ponto de saída: onde o Webpack vai jogar os arquivos finais empacotados
  output: {
    filename: 'bundle.js', // O nome do super-arquivo javascript gerado
    path: path.resolve(__dirname, 'dist'), // A pasta gerada automaticamente
    clean: true, // Limpa a pasta 'dist' toda vez que fizermos um build novo
  },

  // 3. Modo (development para debugar mais fácil, production para comprimir)
  mode: 'production', 

  // 4. Servidor de Desenvolvimento Local
  devServer: {
    static: './dist',
    port: 3000,
    open: true, // Abre o navegador sozinho quando rodar o npm run dev
    hot: true,  // Atualiza a tela em tempo real sem recarregar a página toda
  },

  // 5. Regras para carregar outros tipos de arquivos
  module: {
    rules: [
      {
        // Se o arquivo terminar com .css, use esses loaders:
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], 
      },
    ],
  },

  // 6. Plugins extras
  plugins: [
    // Pega o nosso index.html original, copia para a /dist e injeta o <script> do bundle.js lá dentro
    new HtmlWebpackPlugin({
      template: './index.html',
      title: 'Asteroids JS',
    }),
  ],
};
