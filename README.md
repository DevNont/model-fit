# model-fit

skill สำหรับ Claude Code ที่ช่วยตัดสินใจว่า งานไหน main thread ควรทำเอง งานไหนควรส่งให้ subagent และควรใช้ model อะไร ตลอดวงจรพัฒนา (วางแผน → เขียนโค้ด → ตรวจ → เอกสาร → commit/release) เป้าหมายคือใช้ token น้อยลง โดยงานยังถูกตรวจในมาตรฐานเดิม

## ทำไมต้องมี

เปิด subagent หนึ่งตัวมีต้นทุนคงที่ คือ context ของตัวเอง, brief ที่ต้องเขียน, การอ่านไฟล์ซ้ำ และ report ที่ยังต้องตรวจ การส่งต่อจึงคุ้มเฉพาะเมื่องานใหญ่ ทำขนานกันได้ หรือต้องอ่านไฟล์จำนวนมาก

## ประโยชน์

- ลด token ที่เสียไปกับการเปิด agent โดยไม่จำเป็น
- ใช้ model ราคาแพงเฉพาะงานที่ต้องใช้ (haiku ค้นหา · sonnet งานเขียนที่ระบุชัด · opus งานสร้างจริง · fable ความเห็นที่สอง)
- session ยาวได้โดย context ไม่เต็มเร็ว
- งานอิสระทำขนานกัน งานต่อเนื่องส่งให้ agent ตัวเดิม
- มีเกณฑ์สามชั้นเมื่อต้องใช้ agent มากกว่าหนึ่งตัว: agent ขนานกัน → ทีม agent แยก role (builder/reviewer) → workflow ที่ผู้ใช้สั่งเอง ไม่ข้ามชั้นถ้าชั้นถูกกว่ายังพอ
- คุณภาพไม่ตก เพราะทุกผลงานจาก agent ถูกตรวจเองก่อนรายงานว่าเสร็จ
- ตาราง SDLC ทำแบบ ADLC (agentic development lifecycle): agent ทำงานในแต่ละช่วง คนเป็นผู้ผ่าน gate ของทุกช่วง agent ไม่ผ่านงานตัวเอง และมีช่วง calibrate หลังปล่อยงาน
- รายงานปิดงานบอกเสมอว่าชิ้นไหนทำเองบน model หลัก ชิ้นไหน agent ตัวไหน/model อะไรทำ กี่รอบ และ main thread ตรวจด้วยอะไร ชิ้นที่ไม่ได้ตรวจแยกบอกต่างหาก
- มี feedback loop: ทุกงานที่ส่งต่อบันทึก 1 บรรทัด (agent/model · จำนวนรอบ · ต้องแก้ไหม) ลง work log ของโปรเจกต์ เพื่อปรับเกณฑ์จากข้อมูลจริง
- ทั้งทีมแบ่งงานแบบเดียวกัน

ยังไม่ได้วัดว่าประหยัดได้เท่าไร ตัวเลขเกณฑ์ใน skill (2 ไฟล์, ~40 บรรทัด, 3 agent, ทีม 2-3 role, ~10 agent ต่องาน) เป็นค่าเริ่มต้นที่ปรับได้

## ติดตั้ง

ใช้ส่วนตัว ทุกโปรเจกต์ (macOS / Linux):

ทางที่สั้นที่สุด ใช้ skills CLI (ติดตั้งระดับเครื่อง และอัปเดตทีหลังด้วย `npx skills update -g`):

```bash
npx skills add DevNont/model-fit -g -y
```

หรือติดตั้งด้วยมือ:

```bash
git clone https://github.com/DevNont/model-fit.git
mkdir -p ~/.claude/skills && cp -r model-fit/model-fit ~/.claude/skills/
```

ใช้ทั้งทีมผ่าน repo ของโปรเจกต์:

```bash
mkdir -p .claude/skills && cp -r /path/to/model-fit/model-fit .claude/skills/
git add .claude/skills/model-fit && git commit -m "add model-fit skill"
```

ติดตั้งแล้วเปิด session ใหม่ของ Claude Code โฟลเดอร์ปลายทางต้องเป็น `.../skills/model-fit/SKILL.md`

วิธีอื่น (Windows, คัดลอกไปเครื่องอื่น) และคำอธิบายเต็ม อยู่ใน [`INSTALL.html`](INSTALL.html) — ดาวน์โหลดแล้วเปิดในเบราว์เซอร์

## ใช้งาน

- พิมพ์ `/model-fit`
- หรือปล่อยให้โหลดเอง เมื่อเริ่มงานฟีเจอร์ จะเปิด subagent เลือก model หรือพูดถึงการประหยัด token
- หรือบังคับทุกครั้ง ตามหัวข้อถัดไป

## บังคับใช้ทุก session ทุก prompt (hook)

ติดตั้ง skill อย่างเดียว Claude จะโหลดเฉพาะเมื่อเห็นว่างานเข้าข่าย บางงานจึงหลุด ตั้งแต่ 2026-10-21 skill มี hook มาในโฟลเดอร์ `hooks/` ที่บังคับทุก prompt ของทุกโปรเจกต์บนเครื่อง: โหลด model-fit ก่อน ตัดสินใจผ่าน model-fit และเปิดคำตอบทุกครั้งด้วยบรรทัด `model-fit: <split>` เช่น `model-fit: inline (opus)` หรือ `model-fit: agent Explore/haiku ×2 + inline verify`

ติดตั้ง hook ครั้งเดียวต่อเครื่อง (ต้องมี node ซึ่ง Claude Code ใช้อยู่แล้ว):

```bash
node ~/.agents/skills/model-fit/hooks/install.js
```

สิ่งที่คำสั่งทำ (ทำซ้ำได้ ไม่ซ้อน):

| ทำอะไร | ที่ไหน |
|---|---|
| ลงทะเบียน `hooks/model-fit-gate.sh` ที่ `SessionStart` และ `UserPromptSubmit` (สำรองไฟล์เดิมเป็น `settings.json.bak-model-fit`) | `~/.claude/settings.json` |
| เพิ่มกฎ "always on" ระหว่าง `<!-- model-fit:begin -->` … `<!-- model-fit:end -->` | `~/.claude/CLAUDE.md` |

| ขอบเขต | คำสั่ง | skill ต้องอยู่ที่ |
|---|---|---|
| ทุกโปรเจกต์บนเครื่องนี้ รวม session ในอนาคต | `node ~/.agents/skills/model-fit/hooks/install.js` | `~/.agents/skills/model-fit/` (ติดตั้งด้วย `-g`) |
| ทุกคนที่ทำงานใน repo หนึ่ง | `node .agents/skills/model-fit/hooks/install.js --project` ที่ root ของ repo แล้ว commit `.claude/settings.json` + `CLAUDE.md` | `.agents/skills/model-fit/` ใน repo |
| ถอน | เพิ่ม `--remove` ต่อท้ายคำสั่งเดิม | |

หลัง `npx skills update` ให้รัน install.js ซ้ำ (path ของ hook เดิมยังใช้ได้ แต่กฎใน CLAUDE.md อาจเปลี่ยน) และเปิด session ใหม่ให้ hook เริ่มทำงาน hook เป็นข้อความถึง Claude ทุก prompt ไม่ใช่การบล็อกระดับระบบ แต่มาพร้อมกฎใน CLAUDE.md และ §0 ของ skill จึงหลุดยากกว่าบรรทัดเดียวใน CLAUDE.md มาก

## ข้อควรรู้

- ถ้าโปรเจกต์มีกฎของตัวเองเรื่องชนิด agent ขั้นตรวจ หรือขั้นปล่อยงาน กฎของโปรเจกต์มาก่อน
- ถ้า session ใช้ model ได้ไม่ครบ skill มีวิธีลดขั้นให้ พิมพ์ `/model` เพื่อดูว่าใช้ model อะไรได้
- ถ้า session หลักเป็น model ราคาแพง (fable) skill จะลดงานเล็กบน main thread ให้: ทำเองเฉพาะงานจิ๋ว รวมงานเล็กเป็นชุด ส่งให้ผู้ช่วย sonnet ตัวเดิมตลอด session และแจ้งเมื่อช่วงงานนั้นใช้ model ถูกกว่าได้
- workflow (script ที่สั่ง agent เป็นสิบตัว) เปิดได้เมื่อผู้ใช้สั่งเท่านั้น Claude ไม่เปิดเองแม้งานจะได้ประโยชน์ และ reviewer ต้องเป็น agent คนละตัว (คนละ model ถ้าทำได้) กับ builder
- skill แยกเป็นแกน (`SKILL.md`) กับ reference 3 ไฟล์ที่ Claude อ่านเฉพาะเมื่อเข้าเคส (model หลักราคาแพง · ทีม/workflow · ตาราง SDLC) ลด token ที่จ่ายตอนโหลดทุกครั้ง ต้อง copy ทั้งโฟลเดอร์ ไม่ใช่แค่ `SKILL.md`
- agent ที่ส่งงานกลับมาผิด แก้ซ้ำได้ 1 รอบกับตัวเดิม ถ้ายังผิดให้ทำเองหรือขึ้น model หนึ่งขั้น ไม่วนต่อ
- skill เป็นแนวทางสำหรับ Claude ไม่ใช่การบังคับระดับระบบ

## ไฟล์ใน repo

| ไฟล์ | คืออะไร |
|---|---|
| `model-fit/SKILL.md` | ตัว skill (กติกาแกน โหลดทุกครั้ง) |
| `model-fit/references/expensive-main.md` | งานเล็กเมื่อ model หลักราคาแพง (อ่านเมื่อเข้าเคส) |
| `model-fit/references/teams-and-workflows.md` | ทีม agent และ workflow (อ่านเมื่อใช้ agent มากกว่าหนึ่งตัว) |
| `model-fit/hooks/model-fit-gate.sh` | hook ที่ย้ำกฎทุก prompt (SessionStart + UserPromptSubmit) |
| `model-fit/hooks/install.js` | ตัวติดตั้ง/ถอน hook และกฎใน CLAUDE.md (`--project`, `--remove`) |
| `model-fit/references/sdlc.md` | ตาราง SDLC / ADLC ต่อช่วง: เจ้าของ, gate, สิทธิ์ของ agent, model, ช่วง calibrate และขนาดของรอบงาน |
| `INSTALL.html` | คู่มือติดตั้งและใช้งานภาษาไทย |
