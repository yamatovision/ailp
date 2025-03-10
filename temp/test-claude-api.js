// test-claude-api.js - Claude APIc8c.f%g6cc9c

const Anthropic = require("@anthropic-ai/sdk");

// g0e"e$	f0ch*-c?h><c?
const apiKey = process.env.CLAUDE_API_KEY;
const model = process.env.CLAUDE_API_MODEL || "claude-3-7-sonnet-20250219";

console.log("=== Claude APIf%g6cc9c ===");
console.log("API Keyh(-e.g
6f3:", apiKey ? "h(-e.ccc&cc>c" : "h(-e.ccc&cc>cc");
console.log("d=?g(c"cc+:", model);

if (!apiKey) {
  console.error("c(c)c<: CLAUDE_API_KEY g0e"e$	f0ch(-e.ccc&cc>ccc ");
  process.exit(1);
}

// Anthropicc/c)c$c"c3cc.efe
const anthropic = new Anthropic({
  apiKey: apiKey,
});

// c5c3cc+cc-c3cc
const testPrompt = `
c5c<cc9fe 1:
AIcf4;g(ccc)c3cc#c3c0cc<c8e6d=c5c<cc9c cc<c1cc#c3c0e
9fc.i+cLPcAIch*egfcc>cc 

c?c<c2ccc&c<c6c<:
cc<c1cc#c3c0fe=h c Webe6d=c.e$f3(cf$h(cc&ccd<f%-fe=h 

g.f(c;c4c<c+:
c5c<cc9g3ch><c?cc)c<c c8c.i d?!

d;%d8
c.fe 1cc	c e
9fgc*c)c3cc#c3c0cc<c8c.f'i  o<c;c/c7c'c3f'fo<	cff!cc&cc ccc 
JSONcc)c<cccc'eg-cc&cc ccc 
`;

// cc9ci"f0
async function testClaudeAPI() {
  console.log("APIc*c/c(c9ci d?!d8-...");
  
  try {
    console.time("APIe?g-fi");
    
    // Claude APIc+c*c/c(c9c
    const response = await anthropic.messages.create({
      model: model,
      system: "You are an expert LP designer and web developer.",
      messages: [{ role: "user", content: testPrompt }],
      temperature: 0.7,
      max_tokens: 8192,  // cc9cc'f e$'cc<c/c3f0cfe.
    });
    
    console.timeEnd("APIe?g-fi");
    
    // e?g-c.c!c?cc<c?ch!(g$:
    console.log("
=== c,c9cc3c9c!c?cc<c? ===");
    console.log("c"cc+:", response.model);
    console.log("d=?g(cc<c/c3f0:", {
      input_tokens: response.usage?.input_tokens || "N/A",
      output_tokens: response.usage?.output_tokens || "N/A"
    });
    
    // e?g-c.ee.9ch!(g$:
    console.log("
=== c,c9cc3c9ee.9 ===");
    console.log(response.content[0].text.substring(0, 500) + "...");
    
    console.log("
=== cc9ce.d: ===");
    console.log("c9cc<c?c9: fe
");
    
  } catch (error) {
    console.timeEnd("APIe?g-fi");
    console.error("
=== c(c)c<g:g ===");
    console.error("c(c)c<c!cc;c<c8:", error.message);
    console.error("h)3g40:", error);
    console.log("c9cc<c?c9: e$1f");
  }
}

// cc9ce.h!
testClaudeAPI();
