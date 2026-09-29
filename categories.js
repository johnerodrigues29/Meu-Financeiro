// Sugestões padrão. As categorias dos lançamentos existentes são preservadas.
export const expenseCategories = [
  'Água', 'Luz / energia elétrica', 'Aluguel', 'Condomínio', 'Internet',
  'Telefone / celular', 'Gás', 'Alimentação', 'Supermercado',
  'Restaurantes / delivery', 'Transporte', 'Combustível', 'Uber / táxi',
  'Estacionamento / pedágio', 'Manutenção do veículo', 'Saúde', 'Farmácia',
  'Plano de saúde', 'Educação', 'Cursos', 'Lazer', 'Viagens', 'Compras',
  'Roupas / calçados', 'Cuidados pessoais', 'Pets', 'Filhos', 'Presentes',
  'Assinaturas', 'Seguros', 'Impostos', 'Taxas bancárias', 'Juros',
  'Manutenção da casa', 'Serviços de terceiros', 'Anúncios', 'Hospedagem',
  'Domínios', 'Ferramentas / softwares', 'Doações', 'Outros'
];
export const incomeCategories = [
  'Salário', 'Afiliados', 'Comissões', 'Serviços', 'Freelancer',
  'Vendas', 'Aluguéis recebidos', 'Rendimentos de investimentos',
  'Aposentadoria / pensão', 'Benefícios / auxílios', '13º salário',
  'Férias', 'Bônus / participação nos lucros', 'Reembolsos',
  'Cashback', 'Presentes recebidos', 'Outras receitas'
];
export const standardCategories = type => type === 'income' ? incomeCategories : expenseCategories;
