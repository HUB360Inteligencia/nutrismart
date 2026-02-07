
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;

if (!GOOGLE_API_KEY) {
    console.error('API KEY não encontrada!');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`;

fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.models) {
            console.log('MODELOS DISPONÍVEIS:');
            data.models.forEach(model => {
                // Filtrar apenas modelos 'generateContent'
                if (model.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${model.name} (${model.displayName})`);
                }
            });
        } else {
            console.log('Erro:', data);
        }
    })
    .catch(error => console.error('Erro na requisição:', error));
