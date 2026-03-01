import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em análise de notas fiscais brasileiras (NF-e, NFS-e, CT-e). Sua tarefa é extrair dados com máxima precisão.

REGRAS RIGOROSAS DE EXTRAÇÃO:

1. NÚMERO DA NOTA: 
   - Em XML: procure a tag <nNF>, <numero>, <InfNfse><Numero>, <nCT>
   - Em texto: procure "Nota Fiscal", "NF-e", "Número:", "Nº", "DANFE" seguido de números
   - NUNCA confunda com série, chave de acesso ou protocolo

2. FORNECEDOR/PRESTADOR:
   - Em XML NF-e: use <emit><xNome> (emitente), NÃO <dest> (destinatário)
   - Em XML NFS-e: use <PrestadorServico><RazaoSocial> ou <Prestador>
   - Em texto: procure "Razão Social", "Nome/Razão Social", "Emitente", "Prestador"
   - Use o nome completo, incluindo LTDA, ME, EIRELI etc.

3. VALOR:
   - Em XML NF-e: use <vNF> dentro de <ICMSTot>, ou <vProd> - <vDesc>
   - Em XML NFS-e: use <ValorServicos> ou <ValorLiquidoNfse>
   - NUNCA use valores de impostos individuais (ICMS, IPI, ISS) como valor total
   - Retorne apenas o número decimal (ex: 1234.56), sem "R$"

4. DATAS:
   - Data de emissão: <dhEmi>, <DataEmissao>, <dEmi> — formato YYYY-MM-DD
   - Data de vencimento: <dVenc> dentro de <dup>, <DataVencimento>, <Vencimento>
   - Se houver múltiplas duplicatas, use a PRIMEIRA data de vencimento
   - Se não encontrar vencimento, calcule 30 dias após a emissão
   - ATENÇÃO: datas em XML geralmente vêm em formato ISO (2026-03-15T00:00:00), extraia apenas YYYY-MM-DD

5. TIPO:
   - Se for NFS-e ou tiver <Servico>, <ListaServico>: tipo = "servico"
   - Se for NF-e de produtos ou tiver <det><prod>: tipo = "fornecedor"
   - Na dúvida: "fornecedor"

6. SETOR (classifique pelos itens/descrição):
   - "Administrativo": material de escritório, papelaria, informática, mobiliário
   - "Manutenção": peças, ferramentas, construção, pintura, elétrica, hidráulica, limpeza industrial
   - "Cozinha": alimentos, ingredientes, utensílios de cozinha, gás
   - "GOV.": impostos, taxas, licenças, alvarás, guias
   - "A&B": bebidas, bar, restaurante, café, cerveja
   - "Serviços Gerais": segurança, portaria, jardinagem, terceirizados, contabilidade, advocacia
   - "Operações": qualquer item operacional que não se encaixe acima
   - "Não Identificado": SOMENTE se realmente não for possível classificar

7. DESCRIÇÃO: liste os principais itens/serviços de forma resumida (máx 100 chars)

RESPONDA EXCLUSIVAMENTE com um JSON válido neste formato exato (sem markdown, sem explicações):
{"numero":"","tipo":"fornecedor","fornecedor":"","valor":0,"setor":"","dataEmissao":"YYYY-MM-DD","dataVencimento":"YYYY-MM-DD","descricao":""}`;

    // Use tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tipo do arquivo: ${type}\n\nConteúdo completo:\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_nf_data",
              description: "Extraia os dados da nota fiscal brasileira com precisão.",
              parameters: {
                type: "object",
                properties: {
                  numero: { type: "string", description: "Número da nota fiscal" },
                  tipo: { type: "string", enum: ["servico", "fornecedor"], description: "Tipo da nota" },
                  fornecedor: { type: "string", description: "Nome do fornecedor/prestador (emitente)" },
                  valor: { type: "number", description: "Valor total da nota fiscal" },
                  setor: { type: "string", enum: ["Administrativo", "Manutenção", "Cozinha", "GOV.", "A&B", "Serviços Gerais", "Operações", "Não Identificado"], description: "Setor classificado" },
                  dataEmissao: { type: "string", description: "Data de emissão YYYY-MM-DD" },
                  dataVencimento: { type: "string", description: "Data de vencimento YYYY-MM-DD" },
                  descricao: { type: "string", description: "Descrição resumida dos itens/serviços" },
                },
                required: ["numero", "tipo", "fornecedor", "valor", "setor", "dataEmissao", "dataVencimento", "descricao"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_nf_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar nota fiscal" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Try tool call first, then fallback to content parsing
    let parsed;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      }
    }
    
    if (!parsed) {
      // Fallback: try parsing from content
      const rawContent = data.choices?.[0]?.message?.content || "";
      try {
        const cleaned = rawContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return new Response(JSON.stringify({ error: "Não foi possível extrair dados da nota fiscal", raw: rawContent }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate and sanitize output
    if (parsed.valor && typeof parsed.valor === "string") {
      parsed.valor = parseFloat(parsed.valor.replace(/[^\d.,]/g, "").replace(",", "."));
    }
    
    // Ensure dates are YYYY-MM-DD
    if (parsed.dataEmissao && parsed.dataEmissao.includes("T")) {
      parsed.dataEmissao = parsed.dataEmissao.split("T")[0];
    }
    if (parsed.dataVencimento && parsed.dataVencimento.includes("T")) {
      parsed.dataVencimento = parsed.dataVencimento.split("T")[0];
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-nf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
