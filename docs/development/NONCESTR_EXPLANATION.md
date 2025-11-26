# Understanding `noncestr` for Lark JSAPI Authentication

## What is `noncestr`?

**`noncestr`** stands for **"nonce string"** - it's a random string used in the JSAPI signature calculation for Lark authentication.

### Key Points:

1. **NOT provided by Lark** - You generate it yourself
2. **Used for security** - Part of the signature algorithm to prevent replay attacks
3. **Should be consistent** - Once set for an organization, keep it the same
4. **32 characters recommended** - Random alphanumeric string

## How it's Used

In the JSAPI signature calculation (see `server/server.js` line 664):

```javascript
const verifyStr = `jsapi_ticket=${tickeString}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`
const signature = SHA1(verifyStr)
```

The signature is calculated using:
- `jsapi_ticket` (from Lark)
- `noncestr` (your random string)
- `timestamp` (current time)
- `url` (current page URL)

## How to Generate `noncestr`

### Option 1: Use the SQL Script (Recommended)
The updated `supabase_insert_lark_credentials.sql` script now **auto-generates** a random noncestr for each organization using a helper function.

### Option 2: Generate Manually
You can generate a random 32-character string using:

**JavaScript/Node.js:**
```javascript
function generateNoncestr() {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
console.log(generateNoncestr());
```

**Online Generator:**
- Use any random string generator
- Length: 32 characters
- Characters: A-Z, a-z, 0-9 (avoid confusing: 0/O, 1/l/I)

**Example noncestr:**
```
TRnJnK2X7MtMiMDHwwdR38hnebbdeMAE
```

## What You Need from Lark

When creating a Lark app, you only get:
- ✅ **App ID** (e.g., `cli_a7c6350f9778d010`)
- ✅ **App Secret** (e.g., `cMfrfWMK5vppT6zh89zzohz5jby8GiRc`)

You **don't** get `noncestr` - you create it yourself!

## In Your Current Setup

Looking at your `server_config.js`, you already have a noncestr:
```javascript
noncestr: "TRnJnK2X7MtMiMDHwwdR38hnebbdeMAE"
```

This was auto-generated when you ran `npm run config`. You can:
1. **Reuse this same noncestr** for Organization 1 (if you want consistency)
2. **Generate a new one** for Organization 2
3. **Let the SQL script auto-generate** both (recommended)

## Updated SQL Script

The SQL script now:
- ✅ Auto-generates a random noncestr for each organization
- ✅ Shows the generated noncestr in the output
- ✅ Uses a helper function for consistent generation

You only need to replace:
- `'org-001'` / `'org-002'` → Your organization slugs
- `'cli_xxxxx'` → Your Lark App ID
- `'your-app-secret-1'` → Your Lark App Secret

The `noncestr` will be automatically generated! 🎉

