import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Sheet {
  constructor(name, data) { this.name=name; this.data=data; }
  getName(){return this.name}
  getDataRange(){return {getValues:()=>this.data.map(r=>[...r])}}
  getLastColumn(){return Math.max(...this.data.map(r=>r.length))}
  getRange(row,col,height=1){return {getValues:()=>this.data.slice(row-1,row-1+height).map(r=>r.slice(col-1)),setValue:v=>{this.data[row-1]??=[];this.data[row-1][col-1]=v},setValues:values=>values.forEach((r,i)=>{this.data[row-1+i]??=[];r.forEach((v,j)=>this.data[row-1+i][col-1+j]=v)})}}
  appendRow(r){this.data.push(r);return this}
  deleteRow(r){this.data.splice(r-1,1)}
}
const sheets = Object.fromEntries(Object.entries({
  'Raw Materials':[['Material ID','Raw Material','Sample Starting Stock','Unit'],['RM001','Coffee Beans',1000,'g'],['RM010','Ice Cubes',2000,'g']],
  'Recipes (1)':[['Recipe ID','Product Name','Category'],['REC001','Iced Americano','Coffee'],['REC002','Meal example','Meal']],
  'Recipe Ingredients':[['Recipe ID','Raw Material','Quantity per Serving','Unit'],['REC001','Coffee Beans',18,'g'],['REC001','Ice Cubes',150,'g']],
  'Customizations':[['Recipe ID','Customization','Raw Material','Final Quantity','Unit'],['REC001','No ice','Ice Cubes',0,'g'],['REC001','Custom coffee','Coffee Beans','Exact quantity','g']]
}).map(([name,data])=>[name,new Sheet(name,data)]));
const properties={};
const book={getSheetByName:n=>sheets[n],getId:()=> 'new-sheet',getName:()=> 'New database',insertSheet:n=>sheets[n]=new Sheet(n,[])};
const context=vm.createContext({console,SpreadsheetApp:{getActiveSpreadsheet:()=>book,openById:id=>{assert.equal(id,'new-sheet');return book}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],setProperty:(k,v)=>properties[k]=v})}});
vm.runInContext(readFileSync('Code.gs','utf8'),context);
const run=code=>JSON.parse(JSON.stringify(vm.runInContext(code,context)));
assert.deepEqual(run("routeGet_('getDailySales',{})"),[]);
run('connectNewSheets()');
assert.equal(properties.SPREADSHEET_ID,'new-sheet');
const product=run("routeGet_('getProducts',{})")[0];
assert.equal(product.ProductID,'REC001');
assert.equal(product.recipe[0].materialId,'RM001');
assert.equal(product.customizations[0].quantity,0);
assert.equal(product.customizations[1].requiresExact,true);
const needs=run("calculate_([{productId:'REC001',quantitySold:2,customizations:{RM010:{mode:'Exact',value:0}}}])");
assert.equal(needs.find(r=>r.materialId==='RM001').required,36);
assert.equal(needs.find(r=>r.materialId==='RM010').required,0);
run("updateById_('Inventory','ID','RM001',{Stock:964})");
assert.equal(sheets['Raw Materials'].data[1][2],1000);
assert.equal(run("rows_('Inventory')")[0].Stock,964);
run('connectNewSheets()');
assert.equal(run("rows_('Inventory')")[0].Stock,964);
run("saveRecipe_({productId:'REC001',recipe:[{materialId:'RM001',quantity:27,unit:'g'}]})");
assert.equal(sheets['Recipe Ingredients'].data.length,2);
assert.equal(sheets['Recipe Ingredients'].data[1][1],'Coffee Beans');
assert.equal(run("routeGet_('getProducts',{})")[0].recipe[0].quantity,27);
assert.throws(()=>run("calculate_([{productId:'REC001',quantitySold:1,customizations:{RM001:{mode:'Exact',value:''}}}])"),/required/);
// Count-unit aliases must work without weakening incompatible-unit validation.
run("updateById_('Inventory','ID','RM001',{Unit:'pcs'})");
sheets['Recipe Ingredients'].data[1][2]=2;
for(const unit of ['pc','pcs','piece','pieces',' PC ']){
  sheets['Recipe Ingredients'].data[1][3]=unit;
  const result=run("calculate_([{productId:'REC001',quantitySold:3}])")[0];
  assert.equal(result.required,6);
  assert.equal(result.unit,'pcs');
}
sheets['Recipe Ingredients'].data[1][3]='pc';
assert.throws(()=>run("calculate_([{productId:'REC001',quantitySold:1,customizations:{RM001:{mode:'Exact',value:0.5}}}])"),/whole-number/);
assert.throws(()=>run("calculate_([{productId:'REC001',quantitySold:0.5}])"),/whole-number/);
sheets['Recipe Ingredients'].data[1][3]='g';
assert.throws(()=>run("calculate_([{productId:'REC001',quantitySold:1}])"),/Unit mismatch/);
assert.throws(()=>run("saveRecipe_({productId:'REC001',recipe:[{materialId:'RM001',quantity:2,unit:'g'}]})"),/Unit mismatch/);
sheets['Recipe Ingredients'].data[1][1]='Missing material';
assert.throws(()=>run("rows_('Recipes')"),/Unknown or ambiguous/);
console.log('New sheet adapter checks passed.');
