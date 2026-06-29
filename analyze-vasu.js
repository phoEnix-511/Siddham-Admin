const axios = require('axios');
const cheerio = require('cheerio');

async function analyze() {
  try {
    const res = await axios.get('https://vasustore.com/');
    const $ = cheerio.load(res.data);
    
    console.log("== Main Navigation ==");
    $('header nav, header .header__inline-menu, .header').each((i, el) => {
      console.log($(el).text().replace(/\s+/g, ' ').substring(0, 200));
    });

    console.log("\n== Sections ==");
    $('section, .shopify-section').each((i, el) => {
      const id = $(el).attr('id') || 'no-id';
      const classes = $(el).attr('class') || '';
      
      // Look for headings
      let heading = $(el).find('h1, h2, h3').first().text().trim().replace(/\s+/g, ' ');
      
      // Look for specific components
      let hasCarousel = $(el).find('.slider, .swiper, .carousel').length > 0;
      let hasImages = $(el).find('img').length;
      
      console.log(`- Section ${i}: ID=${id}, Classes=${classes}`);
      if (heading) console.log(`  Heading: ${heading}`);
      if (hasCarousel) console.log(`  Has Carousel/Slider`);
      console.log(`  Images Count: ${hasImages}`);
      
      // Specifically check for quick links / circular categories
      const quickLinks = $(el).find('a img').parent().text().replace(/\s+/g, ' ').substring(0, 100);
      if (quickLinks && classes.includes('custom') || hasImages > 2 && !hasCarousel) {
          console.log(`  Possible Quick Links/Grid contents: ${quickLinks}`);
      }
    });
    
  } catch(e) {
    console.error("Error fetching:", e.message);
  }
}
analyze();