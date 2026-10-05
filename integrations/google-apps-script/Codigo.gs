/**
 * Onboarding CFFGROUP — integração com a planilha e o Google Drive do RH.
 *
 * Cole este código na planilha do RH (Extensões › Apps Script), rode a função
 * "configurar" uma vez e implante como "App da Web" (executar como: Eu;
 * quem pode acessar: Qualquer pessoa). Depois, coloque no Railway:
 *   APPS_SCRIPT_URL     = o endereço do app da Web (termina em /exec)
 *   APPS_SCRIPT_SECRET  = o código secreto mostrado por "configurar"
 *
 * O script roda com a conta de quem o implantou: escreve nesta planilha e salva
 * os documentos numa pasta do Drive dessa conta. Só aceita pedidos que tragam o
 * código secreto.
 */

// Número da aba que recebe os onboardings: o valor depois de "gid=" no endereço
// da aba. Deixe null para usar a primeira aba.
var ABA_GID = 1334707897;

// Pasta do Drive onde ficam as pastas de cada pessoa. Deixe "" para o script
// criar uma pasta "Onboarding RH" no seu Drive na primeira vez.
var PASTA_ID = "";

/** Rode esta função uma vez pelo editor (botão Executar). */
function configurar() {
  var props = PropertiesService.getScriptProperties();
  var segredo = props.getProperty("SEGREDO");
  if (!segredo) {
    segredo = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
    props.setProperty("SEGREDO", segredo);
  }
  var pasta = pastaRaiz_();
  Logger.log("Aba da planilha: " + aba_().getName());
  Logger.log("Pasta dos documentos: " + pasta.getUrl());
  Logger.log("CÓDIGO SECRETO (copie para APPS_SCRIPT_SECRET no Railway): " + segredo);
}

/** Recebe os pedidos do sistema. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var pedido = JSON.parse(e.postData.contents);
    var segredo = PropertiesService.getScriptProperties().getProperty("SEGREDO");
    if (!segredo) return resposta_({ ok: false, erro: 'rode a função "configurar" no editor do Apps Script' });
    if (pedido.segredo !== segredo) return resposta_({ ok: false, erro: "código secreto inválido" });

    lock.waitLock(30000); // um pedido por vez: evita duas linhas iguais ao mesmo tempo
    switch (pedido.acao) {
      case "ping":
        var pasta = pastaRaiz_();
        return resposta_({
          ok: true,
          aba: aba_().getName(),
          planilhaUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
          pasta: pasta.getName(),
          pastaUrl: pasta.getUrl(),
        });

      case "lerPlanilha":
        return resposta_({ ok: true, valores: aba_().getDataRange().getDisplayValues() });

      case "escreverCelulas":
        var sheet = aba_();
        (pedido.celulas || []).forEach(function (c) {
          escrever_(sheet.getRange(c.a1), [[c.valor]]);
        });
        return resposta_({ ok: true });

      case "adicionarLinha":
        var abaLinha = aba_();
        var linha = pedido.linha || [];
        if (linha.length) escrever_(abaLinha.getRange(abaLinha.getLastRow() + 1, 1, 1, linha.length), [linha]);
        return resposta_({ ok: true });

      case "criarPasta":
        var nova = pastaRaiz_().createFolder(String(pedido.nome || "Onboarding"));
        return resposta_({ ok: true, id: nova.getId(), url: nova.getUrl() });

      case "enviarArquivo":
        var blob = Utilities.newBlob(Utilities.base64Decode(pedido.base64), pedido.tipo, pedido.nome);
        var arquivo = DriveApp.getFolderById(pedido.pastaId).createFile(blob);
        return resposta_({ ok: true, id: arquivo.getId() });

      default:
        return resposta_({ ok: false, erro: "ação desconhecida: " + pedido.acao });
    }
  } catch (err) {
    return resposta_({ ok: false, erro: String((err && err.message) || err) });
  } finally {
    lock.releaseLock();
  }
}

function aba_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  if (ABA_GID === null) return planilha.getSheets()[0];
  var abas = planilha.getSheets();
  for (var i = 0; i < abas.length; i++) {
    if (abas[i].getSheetId() === ABA_GID) return abas[i];
  }
  throw new Error("aba não encontrada — confira ABA_GID no código do Apps Script");
}

function pastaRaiz_() {
  var id = PASTA_ID || PropertiesService.getScriptProperties().getProperty("PASTA_ID");
  if (id) return DriveApp.getFolderById(id);
  var pasta = DriveApp.createFolder("Onboarding RH");
  PropertiesService.getScriptProperties().setProperty("PASTA_ID", pasta.getId());
  return pasta;
}

/**
 * Grava como texto puro. Os valores vêm do candidato: um nome começando com "="
 * viraria fórmula na planilha; o apóstrofo inicial faz o Sheets guardar como
 * texto (e não aparece na célula).
 */
function escrever_(range, valores) {
  var seguros = valores.map(function (linha) {
    return linha.map(function (v) {
      var texto = v === null || v === undefined ? "" : String(v);
      return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
    });
  });
  range.setNumberFormat("@").setValues(seguros);
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
