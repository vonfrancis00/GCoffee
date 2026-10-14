/**
 * G Coffee — Daily Sales & Inventory Deduction
 * Google Sheets + Apps Script backend. Paste into the spreadsheet-bound Apps Script project.
 * IMPORTANT: Verify recipe measurements and configure access before production use.
 */
const SCHEMAS = {
  Inventory: ['ID','Name','Category','Unit','Stock','Minimum','UnitCost','Status','UpdatedAt'],
  Products: ['ProductID','ProductName','Category','Status','Description'],
  Recipes: ['RecipeID','ProductID','MaterialID','Quantity','Unit'],
  DailySales: ['DailySalesID','BusinessDate','Status','TotalProductsSold','CreatedAt','FinalizedAt','Remarks','SubmissionID'],
  DailySalesItems: ['ItemID','DailySalesID','ProductID','ProductName','VariationName','QuantitySold','CustomizationsJSON','FinalIngredientsJSON'],
  InventoryTransactions: ['TransactionID','Date','BusinessDate','DailySalesID','MaterialID','MaterialName','Type','Quantity','Unit','StockBefore','StockAfter','Remarks'],
  Modifiers: ['ModifierID','ProductID','MaterialID','ModifierName','Mode','Quantity','Unit','Enabled'],
  Settings: ['Key','Value']
};
// Database tabs for this system's daily sales workflow.
const SHEET_NAMES = {
  Inventory:'Inventory', Products:'Products', Recipes:'Recipes',
  DailySales:'DailySales', DailySalesItems:'DailySalesItems', InventoryTransactions:'InventoryTransactions',
  Modifiers:'Modifiers', Settings:'Settings'
};
function columnName_(name, header) {
  const aliases = {
    Inventory: {'Material ID':'ID','Raw Material':'Name','Sample Starting Stock':'Stock','Current Stock':'Stock'},
    Products: {'Recipe ID':'ProductID','Product Name':'ProductName'},
    Recipes: {'Recipe ID':'ProductID','Raw Material':'MaterialName','Quantity per Serving':'Quantity'},
    Modifiers: {'Recipe ID':'ProductID','Customization':'ModifierName','Raw Material':'MaterialName','Final Quantity':'Quantity'}
  };
  return (aliases[name] || {})[header] || header;
}
function headers_(name, values) {
  return values.map(h => columnName_(name, String(h).trim()));
}
function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '');
    const result = routeGet_(action, (e && e.parameter) || {});
    return json_({success:true, data:result});
  } catch (err) { return json_({success:false,error:String(err && err.message || err)}); }
}
function doPost(e) {
  let body = {};
  try {
    const raw = e && e.postData && e.postData.contents || '{}';
    body = JSON.parse(raw);
    const result = routePost_(String(body.action || ''), body);
    return json_({success:true, data:result, message:result && result.message || 'Operation completed.'});
  } catch (err) { return json_({success:false,error:String(err && err.message || err)}); }
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
const SPREADSHEET_ID = ''; // Use the bound spreadsheet, or the SPREADSHEET_ID script property.
// Optional SPREADSHEET_ID script property overrides the default database.
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || SPREADSHEET_ID;
  const book = id ? SpreadsheetApp.openById(id.trim()) : SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Bind this script to your database spreadsheet or set the SPREADSHEET_ID script property.');
  return book;
}
// Run once from the Apps Script editor. Creates an empty database and connects it.
// Repeated runs reuse the created database; the previous spreadsheet is untouched.
function createDatabaseSpreadsheet() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const existingId = properties.getProperty('DAILY_SALES_DATABASE_ID');
    const book = existingId ? SpreadsheetApp.openById(existingId) : SpreadsheetApp.create('G Coffee - Daily Sales and Inventory Database');
    if (!existingId) properties.setProperty('DAILY_SALES_DATABASE_ID', book.getId());
    Object.keys(SCHEMAS).forEach((name, index) => {
      const sheetName = SHEET_NAMES[name] || name;
      let sheet = book.getSheetByName(sheetName);
      if (!sheet) {
        sheet = !existingId && index === 0 ? book.getSheets()[0].setName(sheetName) : book.insertSheet(sheetName);
      }
      if (sheet.getLastRow() > 0) return;
      const headers = SCHEMAS[name];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold').setBackground('#4b2e23').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
      // Preserve identifiers and date strings exactly as entered.
      headers.forEach((header, column) => {
        if (/ID$/.test(header) || header === 'BusinessDate') {
          sheet.getRange(2, column + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
        }
      });
    });
    SpreadsheetApp.flush();
    properties.setProperty('SPREADSHEET_ID', book.getId());
    const result = {spreadsheetId:book.getId(), url:book.getUrl(), message:'Empty database ready and connected.'};
    console.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}
// Run manually in Apps Script to verify access without changing existing data.
function checkSpreadsheetConnection() {
  const book = ss_();
  const expected = Object.keys(SHEET_NAMES).map(sheetName_);
  const missingSheets = expected.filter(name => !book.getSheetByName(name));
  const sheets = expected.filter(name => book.getSheetByName(name)).map(name => {
    const sh = book.getSheetByName(name);
    return {name:name, headers:sh.getLastColumn() ? sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0] : []};
  });
  const result = {spreadsheetId:book.getId(), spreadsheetName:book.getName(), missingSheets:missingSheets, sheets:sheets};
  console.log(JSON.stringify(result));
  return result;
}
// New spreadsheet layouts take priority; legacy tabs remain supported.
const NEW_SHEET_NAMES = {Inventory:'Raw Materials',Products:'Recipes (1)',Recipes:'Recipe Ingredients',Modifiers:'Customizations'};
function sheetName_(name) {
  const book = ss_();
  if (NEW_SHEET_NAMES[name] && book.getSheetByName(NEW_SHEET_NAMES[name])) return NEW_SHEET_NAMES[name];
  return SHEET_NAMES[name] || name;
}
function tab_(name) {
  const book = ss_(), sheetName = sheetName_(name);
  let sh = book.getSheetByName(sheetName);
  if (!sh) throw new Error('Missing sheet: ' + sheetName + '. Run connectNewSheets from the Apps Script editor.');
  return sh;
}
// Run in the Apps Script project opened from the NEW spreadsheet.
// Reconnects an older deployment without overwriting any existing source rows.
function connectNewSheets() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Open Extensions > Apps Script from your new spreadsheet first.');
  Object.values(NEW_SHEET_NAMES).forEach(name => {
    if (!book.getSheetByName(name)) throw new Error('Missing sheet: ' + name);
  });
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', book.getId());
  ['DailySales','DailySalesItems','InventoryTransactions','Settings'].forEach(name => {
    if (!book.getSheetByName(name)) book.insertSheet(name).appendRow(SCHEMAS[name]);
  });
  ensureStockColumn_();
  return checkSpreadsheetConnection();
}
function ensureStockColumn_() {
  const sh = tab_('Inventory');
  if (sh.getName() !== NEW_SHEET_NAMES.Inventory) return;
  const values = sh.getDataRange().getValues(), headers = values[0].map(String);
  if (headers.includes('Current Stock')) return;
  const start = headers.indexOf('Sample Starting Stock');
  if (start < 0) throw new Error('Raw Materials requires Sample Starting Stock or Current Stock.');
  const column = sh.getLastColumn() + 1;
  sh.getRange(1,column).setValue('Current Stock');
  if (values.length > 1) sh.getRange(2,column,values.length-1,1).setValues(values.slice(1).map(r=>[r[start]]));
}
function rows_(name) {
  const book = ss_(), sh = book.getSheetByName(sheetName_(name));
  if (!sh && ['DailySales','DailySalesItems','InventoryTransactions','Settings'].includes(name)) return [];
  if (!sh) return tab_(name); // Descriptive missing-source error.
  const vals=sh.getDataRange().getValues();
  if(vals.length<2)return [];
  const headers=headers_(name, vals[0]);
  const rows = vals.slice(1).filter(r=>r.some(v=>v!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
  if (name === 'Inventory') return rows.map(r=>({...r,Category:r.Category||'Other',Minimum:r.Minimum||0,UnitCost:r.UnitCost||0,Status:r.Status||'Active'}));
  if (name === 'Products') return rows.map(r=>({...r,Status:r.Status||'Active'}));
  if ((name === 'Recipes' || name === 'Modifiers') && sh.getName() === NEW_SHEET_NAMES[name]) {
    const materials = rows_('Inventory');
    return rows.map((r,index)=>{
      const matches=materials.filter(m=>String(m.Name).trim().toLowerCase()===String(r.MaterialName).trim().toLowerCase());
      if(matches.length!==1) throw new Error('Unknown or ambiguous raw material in '+sh.getName()+': '+r.MaterialName);
      const result={...r,MaterialID:matches[0].ID};
      if(name==='Modifiers') Object.assign(result,{ModifierID:'CUSTOM-'+(index+2),Mode:'Exact',Enabled:'TRUE',RequiresExact:String(r.Quantity).trim().toLowerCase()==='exact quantity'});
      return result;
    });
  }
  return rows;
}
function appendObject_(name, obj) {
  const sh=tab_(name), headers=headers_(name, sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]);
  const newLayout = sh.getName() === NEW_SHEET_NAMES[name];
  const required = newLayout ? ({Products:['ProductID','ProductName','Category'],Recipes:['ProductID','MaterialName','Quantity','Unit'],Modifiers:['ProductID','ModifierName','MaterialName','Quantity','Unit']}[name] || []) : SCHEMAS[name] || [];
  if (newLayout && (name === 'Recipes' || name === 'Modifiers')) obj = {...obj,MaterialName:(rows_('Inventory').find(m=>String(m.ID)===String(obj.MaterialID))||{}).Name};
  const missing = required.filter(h => headers.indexOf(h) < 0);
  if (missing.length) throw new Error('Missing columns in '+(SHEET_NAMES[name]||name)+': '+missing.join(', '));
  sh.appendRow(headers.map(h=>obj[h]===undefined?'':obj[h]));
}
function updateById_(name, idHeader, id, changes) {
  if (name === 'Inventory') ensureStockColumn_();
  const sh=tab_(name);
  let values=sh.getDataRange().getValues(), headers=headers_(name, values[0]);
  Object.keys(changes).forEach(k=>{
    if (!headers.includes(k)) { sh.getRange(1,headers.length+1).setValue(k); headers.push(k); }
  });
  const idCol=headers.indexOf(idHeader);
  if(idCol<0)throw new Error('Missing ID column '+idHeader);
  for(let r=1;r<values.length;r++)if(String(values[r][idCol])===String(id)){
    Object.keys(changes).forEach(k=>{const c=headers.lastIndexOf(k);if(c>=0)sh.getRange(r+1,c+1).setValue(changes[k]);});
    return true;
  }
  return false;
}
function routeGet_(a,p) {
  if(a==='getInventory')return rows_('Inventory');
  if(a==='getProducts') {
    const products=rows_('Products'), recipes=rows_('Recipes'), inventory=rows_('Inventory');
    const modifiers=ss_().getSheetByName(sheetName_('Modifiers')) ? rows_('Modifiers') : [];
    return products.map(x=>({...x,customizations:modifiers.filter(m=>String(m.ProductID)===String(x.ProductID)&&String(m.Enabled).toUpperCase()!=='FALSE').map(m=>({id:m.ModifierID,name:m.ModifierName,materialId:m.MaterialID,quantity:m.RequiresExact?null:Number(m.Quantity),requiresExact:Boolean(m.RequiresExact),mode:m.Mode||'Exact',unit:m.Unit})),recipe:recipes.filter(r=>String(r.ProductID)===String(x.ProductID)).map(r=>({materialId:r.MaterialID,materialName:(inventory.find(m=>String(m.ID)===String(r.MaterialID))||{}).Name||r.MaterialID,quantity:Number(r.Quantity),unit:r.Unit}))}));
  }
  if(a==='getRecipes')return rows_('Recipes');
  if(a==='getModifiers')return rows_('Modifiers');
  if(a==='getDailySales')return rows_('DailySales');
  if(a==='getDailySalesDetails')return {sales:rows_('DailySales').find(x=>x.DailySalesID===p.id)||null,items:rows_('DailySalesItems').filter(x=>x.DailySalesID===p.id)};
  if(a==='getDailyConsumptionReport')return rows_('InventoryTransactions').filter(x=>!p.businessDate||String(x.BusinessDate)===String(p.businessDate));
  if(a==='getInventoryTransactions')return rows_('InventoryTransactions').reverse();
  throw new Error('Unknown GET action: '+a);
}
function routePost_(a,b) {
  if(a==='saveDailySalesDraft')return saveDailySalesDraft_(b);
  if(a==='updateDailySalesDraft')return updateDailySalesDraft_(b);
  if(a==='previewDailyDeduction')return previewDailyDeduction_(b);
  if(a==='finalizeDailySales')return finalizeDailySales_(b);
  if(a==='reverseDailySales')return reverseDailySales_(b);
  if(a==='reconcileInventory')return reconcileInventory_(b);
  if(a==='addInventoryStock')return addInventoryStock_(b);
  if(a==='saveInventoryMaterial')return saveInventoryMaterial_(b);
  if(a==='saveProduct')return saveProduct_(b);
  if(a==='saveRecipe')return saveRecipe_(b);
  if(a==='saveModifier')return saveModifier_(b);
  throw new Error('Unknown POST action: '+a);
}
function saveDailySalesDraft_(b) {
  validateBusinessDate_(b.businessDate);
  const id='DS-'+Utilities.getUuid();
  const items=Array.isArray(b.items)?b.items:[];
  if(!items.length)throw new Error('At least one sales variation is required.');
  appendObject_('DailySales',{DailySalesID:id,BusinessDate:b.businessDate,Status:'Draft',TotalProductsSold:items.reduce((s,x)=>s+validQty_(x.quantitySold,'Quantity sold'),0),CreatedAt:new Date(),FinalizedAt:'',Remarks:'Saved draft',SubmissionID:''});
  saveItems_(id,items);
  return {dailySalesId:id,message:'Draft saved. Inventory was not deducted.'};
}
function updateDailySalesDraft_(b) {
  const id=String(b.dailySalesId||'');const sale=rows_('DailySales').find(x=>String(x.DailySalesID)===id);
  if(!sale||sale.Status!=='Draft')throw new Error('Only an existing draft can be edited.');
  validateBusinessDate_(b.businessDate);
  const sh=tab_('DailySalesItems'), all=sh.getDataRange().getValues(), h=all[0].map(String), col=h.indexOf('DailySalesID');
  for(let i=all.length-1;i>=1;i--)if(String(all[i][col])===id)sh.deleteRow(i+1);
  const items=Array.isArray(b.items)?b.items:[];saveItems_(id,items);
  updateById_('DailySales','DailySalesID',id,{BusinessDate:b.businessDate,TotalProductsSold:items.reduce((s,x)=>s+validQty_(x.quantitySold,'Quantity sold'),0)});
  return {message:'Draft updated; inventory unchanged.'};
}
function saveItems_(id,items) {
  items.forEach(x=>{
    const qty=validQty_(x.quantitySold,'Quantity sold'); if(!x.productId||!x.productName)throw new Error('Each item requires a product.');
    appendObject_('DailySalesItems',{ItemID:'IT-'+Utilities.getUuid(),DailySalesID:id,ProductID:x.productId,ProductName:x.productName,VariationName:x.variationName||'Regular',QuantitySold:qty,CustomizationsJSON:JSON.stringify(x.customizations||{}),FinalIngredientsJSON:JSON.stringify(x.finalIngredients||[])});
  });
}
function previewDailyDeduction_(b) {
  const result=calculate_(b.items||[]);
  const inv=rows_('Inventory');
  return {requirements:result,shortages:result.filter(x=>x.required>x.stock).map(x=>({...x,shortage:x.required-x.stock}))};
}
function calculate_(items) {
  const inventory=rows_('Inventory'), recipes=rows_('Recipes'), products=rows_('Products'), totals={};
  if(!items.length)throw new Error('At least one sales variation is required.');
  items.forEach(item=>{
    const qty=validQty_(item.quantitySold,'Quantity sold');
    const product=products.find(p=>String(p.ProductID)===String(item.productId));
    if(!product||product.Status==='Inactive')throw new Error('Unknown or inactive product: '+item.productId);
    const recipe=recipes.filter(r=>String(r.ProductID)===String(item.productId));
    if(!recipe.length)throw new Error('Product has no recipe: '+product.ProductName);
    const mods=item.customizations||{};
    recipe.forEach(r=>{
      const material=inventory.find(m=>String(m.ID)===String(r.MaterialID));
      if(!material)throw new Error('Recipe references missing material '+r.MaterialID);
      const unit=String(r.Unit||material.Unit);
      if(unit!==String(material.Unit))throw new Error('Unit mismatch for '+material.Name+': recipe '+unit+', inventory '+material.Unit);
      const mod=mods[r.MaterialID]||{mode:'Default'};
      let per=Number(r.Quantity);
      if(mod.mode==='Remove')per=0;
      else if(mod.mode==='Less')per=Math.max(0,per-validQty_(mod.value,'Reduction'));
      else if(mod.mode==='Extra')per+=validQty_(mod.value,'Extra quantity');
      else if(mod.mode==='Exact')per=validQty_(mod.value,'Exact quantity');
      if(!Number.isFinite(per)||per<0)throw new Error('Invalid recipe amount for '+material.Name);
      if(['pcs','slices'].indexOf(unit)>=0&&(!Number.isInteger(per)||!Number.isInteger(qty)))throw new Error(material.Name+' must use whole-number quantities.');
      if(!totals[material.ID])totals[material.ID]={materialId:material.ID,materialName:material.Name,unit:unit,stock:Number(material.Stock)||0,required:0};
      totals[material.ID].required+=per*qty;
    });
  });
  return Object.keys(totals).map(k=>({...totals[k],remaining:totals[k].stock-totals[k].required})).map(x=>({...x,required:roundQty_(x.required),remaining:roundQty_(x.stock-x.required)}));
}
function finalizeDailySales_(b) {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  let saleId='';
  try {
    const submission=String(b.submissionId||''); if(!submission)throw new Error('Unique submissionId is required.');
    const duplicate=rows_('DailySales').find(x=>String(x.SubmissionID)===submission);
    if(duplicate){if(duplicate.Status==='Finalized')return {dailySalesId:duplicate.DailySalesID,message:'This submission was already finalized; no second deduction was made.'};throw new Error('Submission ID already exists in a non-finalized record. Review it before retrying.');}
    validateBusinessDate_(b.businessDate);
    const items=Array.isArray(b.items)?b.items:[];const needs=calculate_(items);
    const shortages=needs.filter(x=>x.required>x.stock);if(shortages.length)throw new Error('Insufficient stock: '+shortages.map(x=>x.materialName+' short '+roundQty_(x.required-x.stock)+' '+x.unit).join(', '));
    // Record recoverable Processing state before applying inventory changes.
    saleId='DS-'+Utilities.getUuid();
    appendObject_('DailySales',{DailySalesID:saleId,BusinessDate:b.businessDate,Status:'Processing',TotalProductsSold:items.reduce((s,x)=>s+validQty_(x.quantitySold,'Quantity sold'),0),CreatedAt:new Date(),FinalizedAt:'',Remarks:'Finalization in progress',SubmissionID:submission});
    saveItems_(saleId,items);
    needs.forEach(n=>{
      const mat=rows_('Inventory').find(m=>String(m.ID)===String(n.materialId));
      if(!mat)throw new Error('Material disappeared during finalization: '+n.materialName);
      const before=Number(mat.Stock)||0, after=roundQty_(before-n.required);
      if(after< -0.000001)throw new Error('Stock changed and is insufficient for '+n.materialName+'. Reconcile and retry.');
      if(!updateById_('Inventory','ID',mat.ID,{Stock:Math.max(0,after),UpdatedAt:new Date()}))throw new Error('Could not update inventory for '+n.materialName);
      appendObject_('InventoryTransactions',{TransactionID:'TX-'+Utilities.getUuid(),Date:new Date(),BusinessDate:b.businessDate,DailySalesID:saleId,MaterialID:mat.ID,MaterialName:mat.Name,Type:'DAILY_CONSUMPTION',Quantity:-n.required,Unit:n.unit,StockBefore:before,StockAfter:Math.max(0,after),Remarks:'Daily sales finalized'});
    });
    updateById_('DailySales','DailySalesID',saleId,{Status:'Finalized',FinalizedAt:new Date(),Remarks:'Inventory deducted'});
    return {dailySalesId:saleId,message:'Daily sales finalized and inventory transactions recorded.'};
  } catch(err) {
    if(saleId)updateById_('DailySales','DailySalesID',saleId,{Status:'NeedsReview',Remarks:'Interrupted or failed finalization: '+String(err.message||err)});
    throw err;
  } finally {lock.releaseLock();}
}
function reverseDailySales_(b) {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const id=String(b.dailySalesId||'');const sale=rows_('DailySales').find(x=>String(x.DailySalesID)===id);
    if(!sale)throw new Error('Daily sales record not found.');
    if(sale.Status!=='Finalized')throw new Error('Only finalized records can be reversed; current status: '+sale.Status);
    const tx=rows_('InventoryTransactions').filter(x=>String(x.DailySalesID)===id&&x.Type==='DAILY_CONSUMPTION');
    if(!tx.length)throw new Error('No original deduction transactions found; manual recovery is required.');
    tx.forEach(t=>{
      const m=rows_('Inventory').find(x=>String(x.ID)===String(t.MaterialID));if(!m)throw new Error('Missing material '+t.MaterialID);
      const before=Number(m.Stock)||0, restore=Math.abs(Number(t.Quantity)||0),after=before+restore;
      updateById_('Inventory','ID',m.ID,{Stock:after,UpdatedAt:new Date()});
      appendObject_('InventoryTransactions',{TransactionID:'TX-'+Utilities.getUuid(),Date:new Date(),BusinessDate:sale.BusinessDate,DailySalesID:id,MaterialID:m.ID,MaterialName:m.Name,Type:'ORDER_REVERSAL',Quantity:restore,Unit:t.Unit,StockBefore:before,StockAfter:after,Remarks:String(b.reason||'Authorized reversal')});
    });
    updateById_('DailySales','DailySalesID',id,{Status:'Reversed',Remarks:String(b.reason||'Reversed')});
    return {message:'Original inventory deductions restored once; reversal logged.'};
  } finally {lock.releaseLock();}
}
function reconcileInventory_(b) {
  const m=rows_('Inventory').find(x=>String(x.ID)===String(b.materialId));if(!m)throw new Error('Material not found.');
  const qty=Number(b.quantity);if(!Number.isFinite(qty)||qty===0)throw new Error('Adjustment quantity must be nonzero.');
  const before=Number(m.Stock)||0,after=before+qty;if(after<0)throw new Error('Adjustment would make stock negative.');
  updateById_('Inventory','ID',m.ID,{Stock:after,UpdatedAt:new Date()});
  appendObject_('InventoryTransactions',{TransactionID:'TX-'+Utilities.getUuid(),Date:new Date(),BusinessDate:b.businessDate||today_(),DailySalesID:b.dailySalesId||'',MaterialID:m.ID,MaterialName:m.Name,Type:'MANUAL_ADJUSTMENT',Quantity:qty,Unit:m.Unit,StockBefore:before,StockAfter:after,Remarks:String(b.remarks||'Reconciliation')});
  return {message:'Inventory reconciliation recorded.'};
}
function addInventoryStock_(b) {
  const m=rows_('Inventory').find(x=>String(x.ID)===String(b.materialId));if(!m)throw new Error('Material not found.');
  const qty=validQty_(b.quantity,'Stock receipt');if(qty<=0)throw new Error('Stock receipt must be greater than zero.');
  const before=Number(m.Stock)||0,after=before+qty;updateById_('Inventory','ID',m.ID,{Stock:after,UpdatedAt:new Date()});
  appendObject_('InventoryTransactions',{TransactionID:'TX-'+Utilities.getUuid(),Date:new Date(),BusinessDate:today_(),DailySalesID:'',MaterialID:m.ID,MaterialName:m.Name,Type:'STOCK_IN',Quantity:qty,Unit:m.Unit,StockBefore:before,StockAfter:after,Remarks:String(b.remarks||'Stock receipt')});
  return {message:'Stock receipt added.'};
}
function saveInventoryMaterial_(b) {
  const id=String(b.id||b.ID||'');const m=rows_('Inventory').find(x=>String(x.ID)===id);if(!m)throw new Error('Material not found.');
  const stock=validQty_(b.stock,'Stock'),minimum=validQty_(b.minimum,'Minimum stock'),cost=validQty_(b.unitCost,'Unit cost');
  if(String(b.unit)!==String(m.Unit))throw new Error('Changing units requires updating recipe units and conversion rules. This action is blocked for safety.');
  updateById_('Inventory','ID',id,{Name:String(b.name||m.Name),Category:String(b.category||m.Category),Stock:stock,Minimum:minimum,UnitCost:cost,Status:String(b.status||m.Status),UpdatedAt:new Date()});
  return {message:'Inventory material saved.'};
}
function saveProduct_(b) {
  const id=String(b.id||b.ProductID||'');const name=String(b.name||b.ProductName||'').trim();if(!name)throw new Error('Product name is required.');
  const old=rows_('Products').find(x=>String(x.ProductID)===id);
  if(old)updateById_('Products','ProductID',id,{ProductName:name,Category:String(b.category||b.Category||old.Category),Status:String(b.status||b.Status||old.Status),Description:String(b.description||b.Description||old.Description||'')});
  else appendObject_('Products',{ProductID:id||'P-'+Utilities.getUuid(),ProductName:name,Category:String(b.category||'Coffee'),Status:String(b.status||'Active'),Description:String(b.description||'')});
  return {message:'Product saved.'};
}
function saveRecipe_(b) {
  const pid=String(b.productId||b.ProductID||'');if(!rows_('Products').some(p=>String(p.ProductID)===pid))throw new Error('Product not found.');
  const recipe=Array.isArray(b.recipe)?b.recipe:[];const inventory=rows_('Inventory');
  recipe.forEach(r=>{const m=inventory.find(x=>String(x.ID)===String(r.materialId||r.MaterialID));if(!m)throw new Error('Unknown material in recipe.');if(String(r.unit||r.Unit)!==String(m.Unit))throw new Error('Unit mismatch for '+m.Name);if(validQty_(r.quantity??r.Quantity,'Recipe quantity')<0)throw new Error('Negative recipe quantity is not allowed.');});
  const sh=tab_('Recipes'),data=sh.getDataRange().getValues(),headers=headers_('Recipes',data[0]),pc=headers.indexOf('ProductID');
  for(let i=data.length-1;i>=1;i--)if(String(data[i][pc])===pid)sh.deleteRow(i+1);
  recipe.forEach(r=>{const mid=String(r.materialId||r.MaterialID);appendObject_('Recipes',{RecipeID:'R-'+pid+'-'+mid,ProductID:pid,MaterialID:mid,Quantity:validQty_(r.quantity??r.Quantity,'Recipe quantity'),Unit:String(r.unit||r.Unit)});});
  return {message:'Recipe saved. Existing finalized consumption snapshots were not changed.'};
}
function saveModifier_(b) {
  const id=String(b.modifierId||b.ModifierID||'MOD-'+Utilities.getUuid());
  appendObject_('Modifiers',{ModifierID:id,ProductID:String(b.productId||''),MaterialID:String(b.materialId||''),ModifierName:String(b.modifierName||''),Mode:String(b.mode||'Default'),Quantity:validQty_(b.quantity||0,'Modifier quantity'),Unit:String(b.unit||''),Enabled:b.enabled===false?'FALSE':'TRUE'});
  return {message:'Modifier saved.'};
}
function validateBusinessDate_(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')))throw new Error('Business date must be YYYY-MM-DD.');}
function validQty_(v,label){if(v===null||v===undefined||String(v).trim()==='')throw new Error(label+' is required.');const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error(label+' must be a finite nonnegative number.');return n;}
function roundQty_(n){return Math.round((Number(n)+Number.EPSILON)*1000000)/1000000;}
function today_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');}
