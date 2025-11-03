const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found' : 'NOT FOUND');
    console.log('\n=== Fetching Available Models ===\n');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Available Models:');
    console.log('================');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`\n📌 ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Supported: ${model.supportedGenerationMethods?.join(', ')}`);
      });
      
      console.log('\n\n=== Recommended Models for Chat ===');
      const chatModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      chatModels.forEach(model => {
        console.log(`✅ ${model.name}`);
      });
      
      // Try the first available model
      if (chatModels.length > 0) {
        const modelName = chatModels[0].name.replace('models/', '');
        console.log(`\n\n🎯 Testing with: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        
        console.log(`\n✅ SUCCESS!`);
        console.log(`Response: ${response.text()}`);
        console.log(`\n🎉 USE THIS MODEL IN server.js: "${modelName}"\n`);
      }
    } else {
      console.log('No models found!');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   1. Invalid API key');
    console.error('   2. API key not enabled for Gemini API');
    console.error('   3. Network/firewall blocking Google APIs');
    console.error('\n🔗 Get a new API key: https://aistudio.google.com/app/apikey');
  }
}

listModels();