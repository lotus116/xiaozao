import { readFileSync, writeFileSync } from 'node:fs';
const base = new URL('./', import.meta.url);
const research = JSON.parse(readFileSync(new URL('research.json', base), 'utf8'));
const supports = {
  steak: '核对厚切牛排先煎上色、降火加黄油浇淋和静置的方法；中心熟度另以食品安全来源复核。',
  beef: '核对牛肉逆纹切、薄浆腌制和分批预炒的方法，不将嫩化剂或原文生肉冲洗引入本版。',
  stir: '核对先备齐材料、分开处理熟得快慢不同的食材、最后合炒的次序；不是该菜全部配方的交叉复刻。',
  braise: '核对煸肉后加液体、轻沸慢炖及开盖收汁的方法；不同肉类的时间按本版大小另作编辑估计。',
  'beef-braise': '核对牛肉先炖软、根菜后加及保留汤量的方法；不把牛肉配方直接当作羊肉或其他汤的定量来源。',
  poach: '核对鸡肉轻沸煮制、熟后处理和独立调汁的方法；不沿用仅看肉汁清澈判断熟度。',
  shrimp: '核对虾应煮至肉熟透、及时离锅及蘸汁分开处理；仅支持虾的加热终点，不代表所有调味相同。',
  fish: '核对鱼身擦干、煎定型后翻面及加汁温和煮制；鱼种、调味与时间取本版家常配方。',
  steam: '核对水开后上蒸架、维持稳定蒸汽和按厚度检查；仅支持蒸制方法，肉馅或虾的熟度另核对。',
  veg: '核对蔬菜沥干、分批煎至熟软、最后合锅调味；烤制版本只借鉴含水量与熟软状态，不套用炒锅时间。',
  rice: '核对米与液体、焖制和熟度观察；电饭煲、烩饭、古斯米各按本版及包装要求，不通用同一水比。',
  noodle: '核对面条先按品种预熟、沥水再与已熟配料合锅；不把炒面煮制分钟数套用于米粉或蒸面。',
  porridge: '核对干银耳泡发去硬根、轻沸慢煮及按稠度判断；本版莲子与糖用量另作编辑取舍。',
  pancake: '核对带泡打粉的厚松饼配方、短时混拌、表面起泡后翻面，修正API薄饼与照片不一致。',
  pasta: '核对肉酱/番茄汁先煮好、面按包装预处理以及酱汁稠度；焗盘还需按本版烤透，不能套用意面时间。',
  cream: '核对黄油面粉先炒、牛奶分次拌入与奶酪温和融化；无面粉的奶油酱只借鉴温和加热。',
  curry: '核对蔬菜先软、咖喱块离火融化再小火防糊；泰式咖喱酱并非咖喱块，按本版先炒酱加椰奶。',
  egg: '核对蛋液在锅中温和加热、推向中心或折叠的方法；本版选全熟终点，非流心蛋版本。',
  salad: '核对蔬菜沥水、调味汁分开混合、临食前轻拌；不作为鸡肉或鱼的熟度来源。',
  bean: '核对使用已熟罐头鹰嘴豆以及液体分次调节质地；其他豆菜仅参考熟豆和稠度控制，不代替原菜配方。',
  thai: '核对河粉软化、酱汁预先混合和短时合锅；叻沙汤底仍按本版原菜记录，不等同泰式炒粉。',
  soup: '核对蔬菜煮软、分批安全搅打与回锅加热；清汤或洋葱汤不采用搅打步骤。',
  friedrice: '核对鸡蛋与配料先做、米饭拨松后再合炒的次序，以及熟饭不宜水分过多。',
  lu: '核对细切五花肉、葱香底、小火卤软与带汁盖饭的方法；本版简化香料并降低酱油用量。',
  kungpao: '核对鸡肉切匀、冷藏腌制和调料预备；宫保版本另核对花生最后放，其他鸡菜不套用宫保酱汁。',
  porktwice: '核对猪肉均匀切配、先熟后回锅或分开加热的方法；炸猪排的裹粉油温来自原菜记录，不来自回锅肉。',
  gyudon: '核对洋葱与薄牛肉在调味液中煮制、带少量汁盖热饭；拌饭及猪排丼的蛋和其他配料另行全熟处理。',
  sweetpork: '核对先把肉煮熟软、最后收浓糖醋汁的原则；锅包肉保留裹浆油炸，未直接采用排骨炖法。',
  salmon: '核对三文鱼先煎上色、照烧汁后入锅避免焦糖；本版不含来源中的面条和蔬菜。',
  carbonara: '核对蛋奶酪酱预混、热面与培根拌匀后离火加酱及面汤调稠；本版增加巴氏蛋与测温要求。',
  scotch: '核对熟蛋先包裹、培根需熟和外层加热的次序；本版是手抓饼变体，非经典肉末面包糠配方。',
};
const fixes = {
  steak: [['外面深色，中心还没到温度','转中小火继续加热，翻面并用食品温度计复查；不要为了追求表面颜色提前出锅。'],['切开流出很多肉汁','先停止切片，完成至少3分钟静置；下次不压肉、不在刚离锅时马上切开。']],
  beef: [['牛肉出水、炒不香','把肉分批摊开，先盛出多余肉；待水分减少再合锅，别长时间大火煮干薄牛肉。'],['肉条发韧','已炒老的肉无法变回原样，可配少量酱汁食用；下次逆纹薄切，避免冷冻硬团或一锅堆满。']],
  stir: [['锅里出水太多','先确认食材熟透，再开盖短时间收汁；下次充分沥水并分批炒，避免小锅塞太满。'],['调味偏咸','先停加酱油和盐，少量补水稀释并保留汁，不再收得很干；不要用更多糖掩盖咸味。']],
  braise: [['肉还硬，汤快没了','每次补约100毫升热水，维持小火轻沸，继续10–15分钟后检查；没软前不要急着收汁。'],['收汁过头、锅底开始粘','立即降火并轻推，未焦时补少量热水；若已有焦苦味，不刮黑锅底混回菜里。']],
  poach: [['中心温度还不够','放回轻沸的汤中继续加热，用食品温度计再查最厚处；不以外层变白或筷子能插入替代熟度检查。'],['鸡肉口感干柴','撕细后拌少量调味汁改善入口；下次别让汤猛烈翻滚，达到安全温度后及时取出。']],
  shrimp: [['虾外面变红、里面还透明','继续温和加热，剖开最大一只检查，最厚肉芯也要变为白色不透明。'],['虾肉缩紧变硬','过熟难以恢复，及时停火；下次以内部熟度为准，达标即捞出，别长时间泡热汤。']],
  fish: [['翻鱼时粘锅破皮','先别强铲，等表面定型再从底部整片托起；碎块仍须煮熟，装盘时轻拿。'],['表面熟、厚处还不够','补少量热水盖锅温和加热，食品温度计复查最厚处；别用大火把外层煎焦。']],
  steam: [['中心未达熟度','确认水仍在沸腾、锅盖盖好，再蒸2分钟后复查；计时结束不是自动熟透。'],['盘底积水太多','用防烫夹取盘，必要时把部分汁另倒小锅调味；不要端着烫盘徒手倾倒。']],
  veg: [['外层上色、里面还硬','降低火力延长加热；炒锅可补1汤匙水短焖，烤箱菜继续烤并观察，直到内层柔软。'],['蔬菜油多、软塌','先盛出沥掉多余油，停止反复翻压；下次控制用油、分批下锅并在熟软后及时离火。']],
  rice: [['米粒或谷物仍有硬芯','按本版锅具和包装要求补少量热水继续加热并复查；熟米饭类需先独立热透再拌，不能只淋热酱。'],['饭太湿黏','先停止加水，轻轻拨松，按步骤继续短时加热或焖制；不要猛搅成糊，也别常温久放等变干。']],
  noodle: [['面条粘成团','加入少量热水或留存面汤，用筷子轻轻拨开；先确认面已熟透，不靠多倒油解决硬芯。'],['面太软、容易断','停止继续翻炒，轻托盛盘；下次按面条品种和包装控制预煮时间，合锅还会继续加热。']],
  porridge: [['银耳仍脆、汤不稠','先检查银耳已泡发且去硬根，补少量热水保持轻沸继续煮；不同品种出胶不同，不强求拉丝。'],['羹太厚开始粘底','关小火，少量补热水并轻搅锅底；已焦黑部分不要刮进羹里。']],
  pancake: [['外面焦、里面还是湿糊','减小火力，单张面糊少舀一点，继续煎至中心无湿糊；不要只看两面颜色就吃。'],['松饼偏薄不蓬松','检查泡打粉是否有效、面粉是否称准；下次面糊刚混匀就停，避免反复长时间搅打。']],
  pasta: [['酱汁太干、面条粘','每次补1汤匙热面汤或热水并轻拌；焗盘要保证面片被酱覆盖，不露出干边。'],['面片或面条中心硬','遵从该面包装要求继续加热，补足可吸收的液体；不要把不同面条的分钟数互相套用。']],
  cream: [['奶汁结团','先移离火，用打蛋器搅开，分次加少量温奶或水；下次粉与油先拌匀，再分次加奶。'],['酱开始油水分离','立即降温或离火，温和搅拌；奶酪类在离火后拌入，避免为了收汁持续大滚。']],
  curry: [['咖喱太稠粘锅','转小火，每次补30毫升热水并铲底；咖喱块必须先离火搅化，不能整块在锅底煎。'],['菜还硬、鸡肉还没熟','先继续温和煮制至菜软，并测鸡肉中心温度；不能为了保持稠度提前结束加热。']],
  egg: [['蛋液表面凝固、中心仍流动','降低火力继续加热，必要时加盖，确认无流动蛋液并按步骤测中心温度，不为嫩滑而保留生芯。'],['蛋底已经深色','立即减火或短暂离火，轻轻松开边缘；下次薄铺蛋液或分份煎，不让外焦内生。']],
  salad: [['拌好后盘底很多水','把多余汁轻轻倒出；下次蔬菜和罐头配料充分沥水，酱汁临吃再拌。'],['配料被拌碎','停止用力搅拌，改用大勺从底部轻托；鱼、奶酪、鸡蛋等柔软配料最后加入。']],
  bean: [['豆泥或豆汁太厚','每次补1汤匙可直接饮用的水或热汤，搅匀再决定是否继续加；冷拌版本不能用生水。'],['豆子中心硬','先核对买的是已熟罐头豆；干豆必须另按安全流程充分煮熟，不能靠这份短加热时间补救。']],
  soup: [['蔬菜打完仍有硬颗粒','先继续煮到根菜能轻松压碎，再稍降温分批搅打；别让普通密封搅拌杯装滚烫汤。'],['汤太厚或咸味太重','每次补少量热水或无盐汤，拌匀再尝；含奶的汤用小火复热，不靠大滚把水蒸干。']],
};
fixes['beef-braise'] = fixes.braise;
fixes.friedrice = fixes.rice;
fixes.lu = fixes.braise;
fixes.gyudon = [['肥牛结团、里面没有熟透','用筷子轻轻拨散，维持小火煮至全部变色且肉芯熟透；不要只捞外层已变色的肉团。'],['调味汁太咸','停加酱油，分次补少量热水稀释，少量淋饭；不再大火收干。']];
fixes.thai = fixes.noodle;
fixes.porktwice = fixes.stir;
fixes.sweetpork = fixes.braise;
fixes.salmon = fixes.fish;
fixes.kungpao = [['鸡肉外层上色，中心温度不足','降低火力继续加热，用食品温度计复查最厚处达到74°C；炸制时先稳住油温，别只看外壳。'],['甜酱或香料容易焦','先降火，酱料按步骤后加；已焦苦的酱不要继续浓缩，下一次提前量好调料避免手忙脚乱。']];
fixes.carbonara = [['蛋酱出现炒蛋碎','立即离火，补少量热面汤轻拌；已凝固的蛋无法完全恢复，但仍需完成安全温度检查。'],['蛋酱稀而挂不住面','最低火不断翻拌并用食品温度计检查，达到71°C后立刻盛出；不要靠猛烈加热收干。']];
fixes.scotch = [['外皮金黄，里面还不够热','降低温度延长烤制，食品温度计测中心；外皮上色不能代替内层饼皮熟透和蛋馅热透。'],['饼皮破口、奶酪流出','用铲托起盛出，避免烫手；下次饼皮适度回软、捏紧接缝，接缝朝下并留间距。']];
const deepFryRescue = [
  ['外壳上色，中心温度仍不足','降低并稳定油温，继续炸制后用食品温度计复查最厚处。热炸油里绝对不要加水；不以外壳金黄判断熟透。'],
  ['裹粉脱落或外壳太厚','先别频繁翻动，待外壳定型再轻翻；下次沥去多余腌汁、薄裹并抖掉浮粉，分批下锅避免油温骤降。'],
];
const rescueById = Object.fromEntries(['home-12','world-53032','world-53034','world-52820','world-52831'].map(id=>[id,deepFryRescue]));
Object.assign(rescueById, {
  'home-24': [['鸡翅表面还有干面粉','薄刷少量油，让浮粉润湿，再继续烤；下次抖掉厚粉，并保证鸡翅单层留缝。'],['外皮深色，里面温度不够','降低设定温度继续加热，用食品温度计避开骨头复查到74°C；不要只为脆皮而停火。']],
  'home-39': [['麻酱越搅越厚','分次加入配方内的凉开水，每次少量搅顺再加；不要一次倒很多水变成稀汤。'],['白菜拌后水多挂不住酱','先倒去盘底多余水，下次彻底沥干菜叶、临吃再拌；不要靠反复加盐让菜更出水。']],
  'home-46': [['拌饭水汪汪','蔬菜和肥牛充分沥水，再少量淋酱；不要把煮肉水一并倒进饭里。'],['豆芽或鸡蛋还没熟透','先分别回锅加热到豆芽熟软、蛋黄蛋白全凝固，完成熟度检查再与饭拌；不能靠热饭余温代替烹调。']],
  'world-52870': [['豆子表面烤不脆','先确认沥干擦干、烤盘单层铺开，再短时延长烤制；熟罐头豆不需要烤到内芯发硬。'],['卷饼破裂、馅往外掉','按包装把饼加热到柔软，减少单张馅料和酱；先折底边，再合两侧。']],
  'world-53000': [['土豆泥陷进蔬菜汁','馅太稀时先回锅收浓，再铺土豆泥；不要靠不停烤顶层来蒸干一盘水。'],['顶部已金黄，中心还不够热','降低烤箱温度继续加热并测中心温度，必要时松盖锡纸保护表面，避免碰到加热管。']],
  'world-53078': [['甜菜或土豆中心还硬','继续小火煮并补足热水，夹最大块确认可扎透；不要把煮好的白豆一起长时间压碎。'],['汤太酸或太咸','每次补少量热水拌匀再尝，先停止加醋和盐；下次调味留一部分最后加入。']],
  'world-52903': [['洋葱变黑而不是褐色','立即降火，未焦处加少量水松开锅底；焦黑苦味不可用更多糖或高汤掩盖，弃去焦糊部分。'],['洋葱一直出水不上色','开盖用中小火耐心蒸发水分并间歇铲底，别把火骤然开到最大；锅小应分批炒。']],
});
const aliasById = {
  'home-01': ['牛排','牛扒','steak','pan seared steak'], 'home-02':['黑椒牛肉','black pepper beef'],
  'home-04':['萝卜焖牛腩'], 'home-05':['西红柿土豆炖牛肉'], 'home-12':['锅包肉'],
  'home-18':['宫爆鸡丁','kung pao chicken'], 'home-24':['空气炸锅炸鸡','炸鸡翅'],
  'home-32':['葱油鳜鱼'], 'home-43':['卤肉饭','滷肉飯','lu rou fan'],
  'home-44':['咖喱饭','日式咖喱饭','japanese curry'], 'home-45':['肥牛饭','牛丼','gyudon'],
  'home-46':['bibimbap'], 'home-48':['肉酱意面','spaghetti bolognese'],
  'home-49':['mac and cheese'], 'home-59':['银耳莲子粥','银耳莲子汤'],
  'world-53191':['pad thai','泰式炒粉'], 'world-52854':['pancakes','pancake'],
  'world-53269':['hummus'], 'world-52963':['shakshuka','北非蛋'],
  'world-52819':['fish tacos','taco','墨西哥鱼肉卷'], 'world-52796':['alfredo','奶油意面'],
  'world-53006':['moussaka'], 'world-53196':['tom yum','冬荫功'],
  'world-53032':['tonkatsu','炸猪扒'], 'world-52821':['laksa','喇沙'],
  'world-52844':['lasagne','lasagna'], 'world-52908':['ratatouille'],
  'world-52820':['katsu curry'], 'world-53034':['katsudon','猪排饭'],
  'world-52823':['risotto'], 'world-52982':['carbonara','卡邦尼意面','卡博纳拉'],
  'world-52915':['omelette','omelet'], 'world-52831':['karaage','日式炸鸡'],
  'world-53078':['borscht','罗宋汤'], 'world-53081':['olivier salad'],
  'world-52850':['couscous','库斯库斯'],
};
const safety = { url:'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures', site:'FoodSafety.gov', author:'美国政府食品安全信息平台', checked:research.checked, supports:'只核对食物中心安全温度、静置及熟度，非配方或口味验证。' };
const handling = { url:'https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety', site:'FoodSafety.gov', author:'美国政府食品安全信息平台', checked:research.checked, supports:'核对生熟分开、冷藏解冻腌制与及时冷藏；室温超过32℃时易腐食品须在1小时内冷藏。' };
const rows = [], guidance = {};
for (const block of readFileSync(new URL('expanded-recipes.txt',base),'utf8').trim().split(/\n(?=@)/)) {
  const [header, ingredientLine, ...lines] = block.split('\n');
  const [id,name,minutes,servings,category,method,focus,flexibility] = header.slice(1).split('|');
  if (!research.records[id] || !research.methods[method] || !supports[method] || !fixes[method]) throw Error(`Missing reviewed metadata: ${id}/${method}`);
  const ingredients = ingredientLine.slice(2).split(';').map((entry) => {
    const colon = entry.indexOf(':');
    if (colon<1) throw Error(`Ingredient syntax: ${id}/${entry}`);
    return {name:entry.slice(0,colon),amount:entry.slice(colon+1),optional:false,water:entry.slice(0,colon)==='水'};
  });
  const steps = [];
  guidance[id] = {};
  for (const line of lines.filter(Boolean)) {
    if (!line.startsWith('S ')) throw Error(`Unexpected line: ${id}/${line}`);
    const [title,amount,heat,action,cue,seconds,...extra] = line.slice(2).split('|');
    if (!title || !action || !cue || extra.length || !/^\d+$/.test(seconds) || guidance[id][title]) throw Error(`Step syntax: ${id}/${line}`);
    const text = `${amount}。${heat}。${action}。${cue}。`;
    // The cue carries any exact temperature mentioned in the action as well,
    // so short hints cannot silently omit or invent a different endpoint.
    const temperatures = [...action.matchAll(/[^。；]*\d+°C[^。；]*/g)].map((m)=>m[0]);
    guidance[id][title] = {amount,heat,cue:[cue,...temperatures.filter((t)=>!cue.includes(t))].join('；')+'。'};
    steps.push({title,text,seconds:Number(seconds)});
  }
  const text = steps.map(s=>s.text).join('');
  const tools = ['刀','砧板','量杯','厨房秤'];
  if (/煎|炒/.test(text)) tools.push('平底锅或炒锅');
  if (/煮|炖/.test(text)) tools.push('煮锅');
  if (/蒸锅|蒸架|蒸垫/.test(text)) tools.push('蒸锅','耐热盘','防烫夹');
  if (/烤箱/.test(text)) tools.push('烤箱','耐热烤盘','隔热手套');
  if (/空气炸锅/.test(text)) tools.push('空气炸锅');
  if (/电饭煲/.test(text)) tools.push('电饭煲');
  if (/搅打|搅拌机/.test(text)) tools.push('搅拌机');
  if (/油温计/.test(text)) tools.push('深锅','油温计');
  if (/食品温度计/.test(text)) tools.push('食品温度计');
  const {sha256,...methodSource} = research.methods[method];
  const { sha256: exactHash, ...exactSource } = research.exact?.[id] || {};
  const reviewedSource = exactSource.url ? exactSource : {...methodSource,supports:supports[method]};
  const additionalSources = [reviewedSource];
  const source = research.records[id].source;
  const simple = ['home-20','home-27','home-38','home-39','home-51','home-53','home-55','world-53269','world-52771','world-52960','world-52777'].includes(id);
  rows.push({id,name,aliases:aliasById[id]||[],description:focus,minutes:Number(minutes),servings:Number(servings),level:simple?1:2,category,ingredients,steps,source,additionalSources,safetySources:[safety,handling],nutrition:null,
    vegetable:ingredients.some(i=>/番茄|土豆|萝卜|洋葱|青椒|彩椒|芹菜|冬瓜|茭白|花菜|茄子|娃娃菜|莲藕|白菜|香菇|蟹味菇|白玉菇|四季豆|西葫芦|豆芽|黄瓜|菠菜|南瓜|生菜|蘑菇|甜菜/.test(i.name)),tools:[...new Set(tools)].join('、'),
    teaching:{focus,flexibility,rescue:(rescueById[id] || fixes[method]).map(([problem,advice])=>({problem,advice})),safety:'生熟用具分开；时间仅是检查提醒，按步骤确认熟度。易腐食品及时冷藏，室温超过32℃时不超过1小时。'},
    timeNote:'总用时为本版备料、烹调与明确等待的编辑估计，新手可能更久；计时器只作检查提醒。',servingsNote:`约${servings}人份，饭菜份量可按食量调整。`,
    editorNote:`多信源资料整理，尚未下厨试做。取舍：${flexibility}补充来源只覆盖所列技法，未声称两套完整配方逐项一致；图片为作者成品参考。`,
    methodReviews:[{...reviewedSource,adaptation:`${focus}。${flexibility}`,step:Math.min(1,steps.length-1)}],stateVersion:3});
}
if(rows.length!==101 || new Set(rows.map(r=>r.id)).size!==101) throw Error('Expected 101 distinct additions');
writeFileSync(new URL('../../src/expanded-recipes.js',base), '// Generated by scripts/catalog/build-expanded.mjs from authored recipe text and reviewed provenance.\nexport const expandedRecipes = '+JSON.stringify(rows,null,2)+';\nexport const expandedStepGuidance = '+JSON.stringify(guidance,null,2)+';\n');
console.log(`Built ${rows.length} additions, ${rows.reduce((n,r)=>n+r.steps.length,0)} guided steps.`);
