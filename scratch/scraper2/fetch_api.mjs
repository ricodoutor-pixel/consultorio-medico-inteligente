import fs from 'fs';

async function fetchAll() {
  const formData = new URLSearchParams();
  formData.append('action', 'jet_smart_filters');
  formData.append('provider', 'jet-engine/default');
  formData.append('query[jet-engine][default][post_status][0]', 'publish');
  formData.append('query[jet-engine][default][post_type]', 'prescritores');
  formData.append('query[jet-engine][default][posts_per_page]', '400');
  formData.append('query[jet-engine][default][paged]', '1');

  try {
    const res = await fetch('https://apepi.org/wp-admin/admin-ajax.php', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    });

    const data = await res.json();
    console.log("Success! Data length:", data.content ? data.content.length : 'no content');
    
    fs.writeFileSync('apepi_api_response.html', data.content || JSON.stringify(data));
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

fetchAll();
