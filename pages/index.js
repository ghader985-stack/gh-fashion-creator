import { useState } from 'react';

export default function Home() {
  const [tab, setTab] = useState('design');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [ratio, setRatio] = useState('9:16');
  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState(false);
  const gold = '#C9A078';

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generate = () => {
    if (!input.trim()) {
      setOutput('Please enter a description');
      return;
    }
    const desc = input.trim();
    let result = '';
    if (tab === 'design') {
      result = 'Professional haute couture fashion photography: ' + desc + '. Elegant Arabian model with long dark wavy hair, warm olive skin, standing in luxurious palace ballroom. Crystal chandeliers, soft golden lighting, shallow depth of field, dreamy bokeh. Vogue Arabia editorial, 8K, Hasselblad quality. --ar ' + ratio + ' --v 6.1 --style raw --s 750 --q 2';
    } else if (tab === 'video') {
      result = 'Cinematic fashion film: ' + desc + '. Elegant Arabian model walking through marble palace corridor. Golden hour lighting, tracking shot, fabric flowing with each step. 4K, 24fps, Dior campaign style. --ar ' + ratio;
    } else if (tab === 'marketing') {
      result = 'INSTAGRAM REEL\n\nHOOK: The dress everyone is asking about\n\nCONTENT:\n- Close-up on fabric details\n- Full design reveal with slow spin\n- Movement shots showing fabric flow\n\nCTA: Order now! Link in bio\n\nCAPTION:\n' + desc + '\nExclusive design\nSizes: XS - XL\nDM or link in bio\n\n#fashion #dress #elegant #GHFashion';
    }
    setOutput(result);
  };

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8F5', padding: '20px', fontFamily: 'system-ui', direction: 'rtl' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #D4AF91, #C9A078)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', color: '#fff', fontWeight: '700' }}>GH</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#C9A078', marginBottom: '10px' }}>AI Fashion Creator</h1>
          <p style={{ color: '#9D8B7A', marginBottom: '30px' }}>Professional Fashion Prompt Generator</p>
          <button onClick={function() { setStarted(true); }} style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #D4AF91, #C9A078)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', cursor: 'pointer' }}>Start Now</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F5', padding: '16px', fontFamily: 'system-ui', direction: 'rtl' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '1.2rem', color: '#C9A078' }}>AI Fashion Creator</h1>
        </header>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '14px' }}>
          <button onClick={function() { setTab('design'); setOutput(''); }} style={{ padding: '10px 14px', borderRadius: '20px', cursor: 'pointer', border: 'none', background: tab === 'design' ? '#C9A078' : 'white', color: tab === 'design' ? '#fff' : '#9D8B7A' }}>Design</button>
          <button onClick={function() { setTab('video'); setOutput(''); }} style={{ padding: '10px 14px', borderRadius: '20px', cursor: 'pointer', border: 'none', background: tab === 'video' ? '#C9A078' : 'white', color: tab === 'video' ? '#fff' : '#9D8B7A' }}>Video</button>
          <button onClick={function() { setTab('marketing'); setOutput(''); }} style={{ padding: '10px 14px', borderRadius: '20px', cursor: 'pointer', border: 'none', background: tab === 'marketing' ? '#C9A078' : 'white', color: tab === 'marketing' ? '#fff' : '#9D8B7A' }}>Marketing</button>
        </div>
        <div style={{ background: 'white', borderRadius: '20px', padding: '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D' }}>Aspect Ratio</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={function() { setRatio('1:1'); }} style={{ padding: '8px 18px', borderRadius: '12px', cursor: 'pointer', border: 'none', background: ratio === '1:1' ? '#C9A078' : '#eee', color: ratio === '1:1' ? '#fff' : '#666' }}>1:1</button>
              <button onClick={function() { setRatio('9:16'); }} style={{ padding: '8px 18px', borderRadius: '12px', cursor: 'pointer', border: 'none', background: ratio === '9:16' ? '#C9A078' : '#eee', color: ratio === '9:16' ? '#fff' : '#666' }}>9:16</button>
              <button onClick={function() { setRatio('16:9'); }} style={{ padding: '8px 18px', borderRadius: '12px', cursor: 'pointer', border: 'none', background: ratio === '16:9' ? '#C9A078' : '#eee', color: ratio === '16:9' ? '#fff' : '#666' }}>16:9</button>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#8D7D6D' }}>Description</label>
            <textarea value={input} onChange={function(e) { setInput(e.target.value); }} placeholder="Describe your design..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', minHeight: '80px', boxSizing: 'border-box' }} />
          </div>
          <button onClick={generate} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #D4AF91, #C9A078)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1rem', cursor: 'pointer' }}>Generate Prompt</button>
          {output && (
            <div style={{ marginTop: '16px', padding: '14px', background: '#f9f9f9', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#C9A078', fontWeight: '600' }}>Result</span>
                <button onClick={copy} style={{ padding: '6px 14px', background: copied ? '#7CB07C' : '#C9A078', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff' }}>{copied ? 'Copied!' : 'Copy'}</button>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '10px', whiteSpace: 'pre-wrap' }}>{output}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
