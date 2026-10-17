/**
 * ARI - Database + KPI + Risk Engine
 */

// Extracted from the provided Excel file (1000 names)
const COMPANY_NAMES = [
  "PT Abadi Nusantara Hijau Investam", "PT Adhi Kartiko Pratama Tbk", "PT Agro Yasa Lestari Tbk", "PT Alakasa Industrindo Tbk", "PT Alkindo Naratama Tbk",
  "PT Alumindo Light Metal Industry", "PT Amman Mineral Internasional Tb", "PT Ancora Indonesia Resources Tbk", "PT Aneka Tambang Tbk", "PT Archi Indonesia Tbk",
  "PT Argha Karya Prima Industry Tbk", "PT Asiaplast Industries Tbk", "PT Avia Avian Tbk", "PT Barito Pacific Tbk", "PT Benteng Api Technic Tbk",
  "PT Berkah Beton Sadaya Tbk", "PT Berlina Tbk", "PT Betonjaya Manunggal Tbk", "PT Bintang Mitra Semestaraya Tbk", "PT Bumi Resources Minerals Tbk",
  "PT Cemindo Gemilang Tbk", "PT Central Omega Resources Tbk", "PT Champion Pacific Indonesia Tbk", "PT Chandra Asri Pacific Tbk", "PT Chemstar Indonesia Tbk",
  "PT Cita Mineral Investindo Tbk", "PT Citra Tubindo Tbk", "PT Colorpak Indonesia Tbk", "PT Darmi Bersaudara Tbk", "PT Duta Pertiwi Nusantara Tbk",
  "PT ESSA Industries Indonesia Tbk", "PT Ekadharma International Tbk", "PT Emdeki Utama Tbk", "PT Eterindo Wahanatama Tbk", "PT Fajar Surya Wisesa Tbk",
  "PT Gunawan Dianjaya Steel Tbk", "PT Gunung Raja Paksi Tbk", "PT HK Metals Utama Tbk", "PT Ifishdeco Tbk", "PT Indah Kiat Pulp & Paper Tbk",
  "PT Indal Aluminium Industry Tbk", "PT Indo Acidatama Tbk", "PT Indo Komoditi Korpora Tbk", "PT Indocement Tunggal Prakarsa Tb", "PT Indonesia Fibreboard Industry",
  "PT Indonesia Morowali Industrial Park", "PT Indopoly Swakarsa Industry Tbk", "PT Intanwijaya Internasional Tbk", "PT Inter Delta Tbk", "PT J Resources Asia Pasifik Tbk",
  "PT Jakarta Kyoei Steel Works Tbk", "PT Kapuas Prima Coal Tbk", "PT Kedawung Setia Industrial Tbk", "PT Kertas Basuki Rachmat Indonesi", "PT Kirana Megatara Tbk",
  "PT Krakatau Steel (Persero) Tbk", "PT Kusuma Kemindo Sentosa Tbk", "PT Lautan Luas Tbk", "PT Lionmesh Prima Tbk", "PT Lotte Chemical Titan Tbk",
  "PT Madusari Murni Indah Tbk", "PT Megalestari Epack Sentosaraya", "PT Merdeka Battery Materials Tbk", "PT Merdeka Copper Gold Tbk", "PT Mineral Industri Indonesia (Persero) / MIND ID",
  "PT Nusa Palapa Gemilang Tbk", "PT OBM Drilchem Tbk", "PT Optima Prima Metal Sinergi Tbk", "PT PAM Mineral Tbk", "PT Pabrik Kertas Tjiwi Kimia Tbk",
  "PT Panca Budi Idaman Tbk", "PT Paperocks Indonesia Tbk", "PT Pelangi Indah Canindo Tbk", "PT Pelat Timah Nusantara Tbk", "PT Polychem Indonesia Tbk",
  "PT Primadaya Plastisindo Tbk", "PT Pupuk Indonesia (Persero)", "PT SLJ Global Tbk", "PT Samator Indo Gas Tbk", "PT Saranacentral Bajatama Tbk",
  "PT Saraswanti Anugerah Makmur Tbk", "PT Satyamitra Kemas Lestari Tbk", "PT Semen Baturaja Tbk", "PT Semen Indonesia (Persero) Tbk", "PT Sinergi Inti Plastindo Tbk",
  "PT Sinergi Multi Lestarindo Tbk", "PT Siwani Makmur Tbk", "PT Solusi Bangun Indonesia Tbk", "PT Sriwahana Adityakarta Tbk", "PT Steel Pipe Industry of Indones",
  "PT Sumber Mineral Global Abadi Tb", "PT Suparma Tbk", "PT Superior Prima Sukses Tbk", "PT Surya Biru Murni Acetylene Tbk", "PT Tembaga Mulia Semanan Tbk",
  "PT Tianrong Chemicals Industry Tb", "PT Timah Tbk", "PT Tirta Mahakam Resources Tbk", "PT Toba Pulp Lestari Tbk", "PT Trias Sentosa Tbk",
  "PT Trimegah Bangun Persada Tbk", "PT Trinitan Metals and Minerals T", "PT Tunas Alfin Tbk", "PT Unggul Indah Cahaya Tbk", "PT Vale Indonesia Tbk",
  "PT Waskita Beton Precast Tbk", "PT Weda Bay Nickel", "PT Wijaya Cahaya Timber Tbk", "PT Wijaya Karya Beton Tbk", "PT Wilton Makmur Indonesia Tbk",
  "PT Xolare RCR Energy Tbk", "PT Yanaprima Hastapersada Tbk", "PT Agro Bahari Nusantara Tbk", "PT Agung Menjangan Mas Tbk", "PT Akasha Wira International Tbk",
  "PT Aman Agrindo Tbk", "PT Amerta Indah Otsuka", "PT Andira Agro Tbk", "PT Asia Sejahtera Mina Tbk", "PT Asian Agri",
  "PT Astra Agro Lestari Tbk", "PT Austindo Nusantara Jaya Tbk", "PT BISI International Tbk", "PT Bakrie Sumatera Plantations Tb", "PT Bentoel Internasional Investama",
  "PT Budi Starch & Sweetener Tbk", "PT Bumi Teknokultura Unggul Tbk", "PT Buyung Poetra Sembada Tbk", "PT Campina Ice Cream Industry Tbk", "PT Cargill Indonesia",
  "PT Central Proteina Prima Tbk", "PT Cerestar Indonesia Tbk", "PT Charoen Pokphand Indonesia Tbk", "PT Cilacap Samudera Fishing Indus", "PT Cisadane Sawit Raya Tbk",
  "PT Cisarua Mountain Dairy Tbk", "PT Citra Borneo Utama Tbk", "PT Coca-Cola Europacific Partners Indonesia", "PT Cottonindo Ariesta Tbk", "PT DFI Retail Nusantara Tbk",
  "PT Delta Djakarta Tbk", "PT Dewi Shri Farmindo Tbk", "PT Dharma Samudera Fishing Indust", "PT Dharma Satya Nusantara Tbk", "PT Diamond Food Indonesia Tbk",
  "PT Djarum", "PT Dua Putra Utama Makmur Tbk", "PT Duta Intidaya Tbk", "PT Eagle High Plantations Tbk", "PT Enseval Putera Megatrading Tbk",
  "PT Era Mandiri Cemerlang Tbk", "PT Estee Gold Feet Tbk", "PT Estika Tata Tiara Tbk", "PT FAP Agri Tbk", "PT FKS Food Sejahtera Tbk",
  "PT FKS Multi Agro Tbk", "PT Falmaco Nonwoven Industri Tbk", "PT Fonterra Brands Indonesia", "PT Formosa Ingredient Factory Tbk", "PT Frisian Flag Indonesia",
  "PT Garudafood Putra Putri Jaya Tb", "PT Golden Plantation Tbk", "PT Gozco Plantations Tbk", "PT Graha Prima Mentari Tbk", "PT Gudang Garam Tbk",
  "PT Gunanusa Eramandiri Tbk", "PT H.M. Sampoerna Tbk", "PT Hassana Boga Sejahtera Tbk", "PT Hatten Bali Tbk", "PT Heinz ABC Indonesia",
  "PT Indo American Seafoods Tbk", "PT Indo Boga Sukses Tbk", "PT Indo Oil Perkasa Tbk", "PT Indo Pureco Pratama Tbk", "PT Indofood CBP Sukses Makmur Tbk",
  "PT Indofood Sukses Makmur Tbk", "PT Indomarco Prismatama (Indomaret)", "PT Indonesian Tobacco Tbk", "PT Janu Putra Sejahtera Tbk", "PT Japfa Comfeed Indonesia Tbk",
  "PT Jaya Agra Wattie Tbk", "PT Jaya Swarasa Agung Tbk", "PT Jhonlin Agro Raya Tbk", "PT Jobubu Jarum Minahasa Tbk", "PT Kao Indonesia",
  "PT Kino Indonesia Tbk", "PT Kurniamitra Duta Sentosa Tbk", "PT L'Oréal Indonesia", "PT Leyand International Tbk", "PT Lion Super Indo",
  "PT Lovina Beach Brewery Tbk", "PT Mahkota Group Tbk", "PT Malindo Feedmill Tbk", "PT Mandom Indonesia Tbk", "PT Martina Berto Tbk",
  "PT Matahari Putra Prima Tbk", "PT Maxindo Karya Anugerah Tbk", "PT Mayora Indah Tbk", "PT Menthobi Karyatama Raya Tbk", "PT Midi Utama Indonesia Tbk",
  "PT Millennium Pharmacon Internati", "PT Mitra Tirta Buwana Tbk", "PT Mondelez Indonesia", "PT Morenzo Abadi Perkasa Tbk", "PT Mulia Boga Raya Tbk",
  "PT Multi Agro Gemilang Plantation", "PT Multi Bintang Indonesia Tbk", "PT Multi Spunindo Jaya Tbk", "PT Multipolar Tbk", "PT Musim Mas",
  "PT Mustika Ratu Tbk", "PT Nanotech Indonesia Global Tbk", "PT Nestlé Indonesia", "PT Nippon Indosari Corpindo Tbk", "PT Nusantara Sawit Sejahtera Tbk",
  "PT PP London Sumatra Indonesia Tb", "PT Palma Serasih Tbk", "PT Panca Mitra Multiperdana Tbk", "PT Paragon Technology and Innovation", "PT Pinago Utama Tbk",
  "PT Platinum Wahab Nusantara Tbk", "PT Pradiksi Gunatama Tbk", "PT Prasidha Aneka Niaga Tbk", "PT Prima Cakrawala Abadi Tbk", "PT Procter & Gamble Home Products Indonesia",
  "PT Pulau Subur Tbk", "PT Salim Ivomas Pratama Tbk", "PT Sampoerna Agro Tbk", "PT Santos Jaya Abadi (Kapal Api)", "PT Sariguna Primatirta Tbk",
  "PT Sawit Sumbermas Sarana Tbk", "PT Segar Kumala Indonesia Tbk", "PT Sekar Bumi Tbk", "PT Sekar Laut Tbk", "PT Sentra Food Indonesia Tbk",
  "PT Siantar Top Tbk", "PT Sinar Sosro", "PT Smart Tbk", "PT Sreeya Sewu Indonesia Tbk", "PT Sumber Alfaria Trijaya Tbk",
  "PT Sumber Tani Agung Resources Tb", "PT Suntory Garuda Beverage", "PT Supra Boga Lestari Tbk", "PT Teladan Prima Agro Tbk", "PT Tigaraksa Satria Tbk",
  "PT Tirta Investama (Danone-AQUA)", "PT Toba Surimi Industries Tbk", "PT Tri Banyan Tirta Tbk", "PT Triputra Agro Persada Tbk", "PT Tunas Baru Lampung Tbk",
  "PT Ultrajaya Milk Industry & Trad", "PT Uni-Charm Indonesia Tbk", "PT Unilever Indonesia Tbk", "PT Victoria Care Indonesia Tbk", "PT Wahana Interfood Nusantara Tbk",
  "PT Wahana Inti Makmur Tbk", "PT Wahana Pronatural Tbk", "PT Wicaksana Overseas Internation", "PT Widodo Makmur Perkasa Tbk", "PT Widodo Makmur Unggas Tbk",
  "PT Wilmar Cahaya Indonesia Tbk", "PT Wilmar Nabati Indonesia", "PT Wings Surya", "PT Wismilak Inti Makmur Tbk", "PT Yakult Indonesia Persada",
  "PT ABM Investama Tbk", "PT AKR Corporindo Tbk", "PT Adaro Minerals Indonesia Tbk", "PT Alamtri Resources Indonesia Tb", "PT Alfa Energi Investama Tbk",
  "PT Ancara Logistics Indonesia Tbk", "PT Apexindo Pratama Duta Tbk", "PT Artha Mahiya Investama Tbk", "PT Astrindo Nusantara Infrastrukt", "PT Atlantis Subsea Indonesia Tbk",
  "PT Atlas Resources Tbk", "PT Baramulti Suksessarana Tbk", "PT Batulicin Nusantara Maritim Tb", "PT Bayan Resources Tbk", "PT Berau Coal",
  "PT Bintang Samudera Mandiri Lines", "PT Black Diamond Resources Tbk", "PT Borneo Olah Sarana Sukses Tbk", "PT Buana Lintas Lautan Tbk", "PT Bukit Asam Tbk",
  "PT Bumi Resources Tbk", "PT Cakra Buana Resources Energi T", "PT Capitalinc Investment Tbk", "PT Capitol Nusantara Indonesia Tb", "PT Citra Nusantara Gemilang Tbk",
  "PT Dana Brata Luhur Tbk", "PT Darma Henwa Tbk", "PT Delta Dunia Makmur Tbk", "PT Dian Swastatika Sentosa Tbk", "PT Dwi Guna Laksana Tbk",
  "PT Elnusa Tbk", "PT Energi Mega Persada Tbk", "PT Exploitasi Energi Indonesia Tb", "PT Freeport Indonesia", "PT GTS Internasional Tbk",
  "PT Garda Tujuh Buana Tbk", "PT Ginting Jaya Energi Tbk", "PT Golden Eagle Energy Tbk", "PT Golden Energy Mines Tbk", "PT Harum Energy Tbk",
  "PT Hillcon Tbk", "PT Humpuss Intermoda Transportasi", "PT Humpuss Maritim Internasional", "PT IMC Pelita Logistik Tbk", "PT Indah Prakasa Sentosa Tbk",
  "PT Indika Energy Tbk", "PT Indo Straits Tbk", "PT Indo Tambangraya Megah Tbk", "PT Kaltim Prima Coal", "PT Kian Santang Muliatama Tbk",
  "PT Kideco Jaya Agung", "PT Logindo Samudramakmur Tbk", "PT MNC Energy Investments Tbk", "PT Mandiri Herindo Adiperkasa Tbk", "PT Medco Energi Internasional Tbk",
  "PT Mitra Energi Persada Tbk", "PT Mitrabahtera Segara Sejati Tbk", "PT Mitrabara Adiperdana Tbk", "PT Multikarya Asia Pasifik Raya T", "PT Pelayaran Nasional Bina Buana",
  "PT Pelayaran Tamarin Samudra Tbk", "PT Perdana Karya Perkasa Tbk", "PT Pertamina (Persero)", "PT Pertamina Hulu Rokan", "PT Pertamina Patra Niaga",
  "PT Perusahaan Gas Negara Tbk", "PT Petrindo Jaya Kreasi Tbk", "PT Petrosea Tbk", "PT Prima Andalan Mandiri Tbk", "PT RMK Energy Tbk",
  "PT Radiant Utama Interinsco Tbk", "PT Ratu Prabu Energi Tbk", "PT Resource Alam Indonesia Tbk", "PT Rig Tenders Indonesia Tbk", "PT Royaltama Mulia Kontraktorindo",
  "PT Rukun Raharja Tbk", "PT SMR Utama Tbk", "PT Samindo Resources Tbk", "PT Semacom Integrated Tbk", "PT Sigma Energy Compressindo Tbk",
  "PT Sillo Maritime Perdana Tbk", "PT Sky Energy Indonesia Tbk", "PT Soechi Lines Tbk", "PT Sugih Energy Tbk", "PT Sumber Energi Andalan Tbk",
  "PT Sumber Global Energy Tbk", "PT Sunindo Pratama Tbk", "PT Super Energy Tbk", "PT TBS Energi Utama Tbk", "PT Trada Alam Minera Tbk",
  "PT Trans Power Marine Tbk", "PT Transcoal Pacific Tbk", "PT Ulima Nitra Tbk", "PT Wintermar Offshore Marine Tbk", "PT Ace Oldfields Tbk",
  "PT Arita Prima Indonesia Tbk", "PT Arkha Jayanti Persada Tbk", "PT Arwana Citramulia Tbk", "PT Asahimas Flat Glass Tbk", "PT Astra Graphia Tbk",
  "PT Astra International Tbk", "PT Ateliers Mecaniques D Indonesi", "PT Bakrie & Brothers Tbk", "PT Berkah Prima Perkasa Tbk", "PT Cahayaputra Asa Keramik Tbk",
  "PT Carsurin Tbk", "PT Citatah Tbk", "PT Communication Cable Systems In", "PT Dosni Roha Indonesia Tbk", "PT Dyandra Media International Tb",
  "PT Ecocare Indo Pasifik Tbk", "PT Geoprima Solusi Tbk", "PT Grand Kartech Tbk", "PT Green Power Group Tbk", "PT Harapan Duta Pertiwi Tbk",
  "PT Hexindo Adiperkasa Tbk", "PT Hoffmen Cleanindo Tbk", "PT Impack Pratama Industri Tbk", "PT Intan Baru Prana Tbk", "PT Intikeramik Alamasri Industri",
  "PT Intraco Penta Tbk", "PT Island Concepts Indonesia Tbk", "PT Jasuindo Tiga Perkasa Tbk", "PT Jembo Cable Company Tbk", "PT KMI Wire & Cable Tbk",
  "PT Kabelindo Murni Tbk", "PT Keramika Indonesia Assosiasi T", "PT Kobexindo Tractors Tbk", "PT Kokoh Inti Arebama Tbk", "PT Lion Metal Works Tbk",
  "PT MNC Asia Holding Tbk", "PT Mark Dynamics Indonesia Tbk", "PT Mitra Pack Tbk", "PT Modern Internasional Tbk", "PT Mulia Industrindo Tbk",
  "PT Multi Garam Utama Tbk", "PT Multi Hanna Kreasindo Tbk", "PT Multi Makmur Lemindo Tbk", "PT Multifiling Mitra Indonesia Tb", "PT Mutuagung Lestari Tbk",
  "PT Nusatama Berkah Tbk", "PT Perdana Bangun Pusaka Tbk", "PT Perma Plasindo Tbk", "PT Personel Alih Daya Tbk", "PT Sarana Mitra Luas Tbk",
  "PT Satu Visi Putra Tbk", "PT Shield On Service Tbk", "PT Singaraja Putra Tbk", "PT Steadfast Marine Tbk", "PT Sumi Indo Kabel Tbk",
  "PT Superkrane Mitra Utama Tbk", "PT Supreme Cable Manufacturing &", "PT Surya Pertiwi Tbk", "PT Surya Toto Indonesia Tbk", "PT Tanah Laut Tbk",
  "PT Tira Austenite Tbk", "PT Triwira Insanlestari Tbk", "PT United Tractors Tbk", "PT Voksel Electric Tbk", "PT Widiant Jaya Krenindo Tbk",
  "PT Anugerah Kagum Karya Utama Tbk", "PT Anugerah Spareparts Sejahtera", "PT Argo Pantes Tbk", "PT Arkadia Digital Media Tbk", "PT Arsy Buana Travelindo Tbk",
  "PT Arthavest Tbk", "PT Asia Pacific Fibers Tbk", "PT Asia Pacific Investama Tbk", "PT Aspirasi Hidup Indonesia Tbk", "PT Astra Honda Motor",
  "PT Astra Otoparts Tbk", "PT Autopedia Sukses Lestari Tbk", "PT Bali Bintang Sejahtera Tbk", "PT Bayu Buana Tbk", "PT Bersama Mencapai Puncak Tbk",
  "PT Bersama Zatta Jaya Tbk", "PT Bintang Oto Global Tbk", "PT Boston Furniture Industries Tb", "PT Bukit Uluwatu Villa Tbk", "PT Cahaya Bintang Medan Tbk",
  "PT Catur Sentosa Adiprana Tbk", "PT Caturkarda Depo Bangunan Tbk", "PT Century Textile Industry Tbk", "PT Champ Resto Indonesia Tbk", "PT Chitose Internasional Tbk",
  "PT Cipta Perdana Lancar Tbk", "PT Cipta Selera Murni Tbk", "PT Citra Putra Realty Tbk", "PT DMS Propertindo Tbk", "PT Dafam Property Indonesia Tbk",
  "PT Damai Sejahtera Abadi Tbk", "PT Destinasi Tirta Nusantara Tbk", "PT Dharma Polimetal Tbk", "PT Eastparc Hotel Tbk", "PT Electronic City Indonesia Tbk",
  "PT Era Media Sejahtera Tbk", "PT Erajaya Swasembada Tbk", "PT Eratex Djaja Tbk", "PT Esta Multi Usaha Tbk", "PT Ever Shine Tex Tbk",
  "PT Fast Food Indonesia Tbk", "PT Fortune Indonesia Tbk", "PT Gajah Tunggal Tbk", "PT Garuda Metalindo Tbk", "PT Gaya Abadi Sempurna Tbk",
  "PT Gema Grahasarana Tbk", "PT Global Mediacom Tbk", "PT Globe Kita Terang Tbk", "PT Golden Flower Tbk", "PT Goodyear Indonesia Tbk",
  "PT Graha Andrasentra Propertindo", "PT Graha Layar Prima Tbk", "PT Greenwood Sejahtera Tbk", "PT Griptha Putra Persada Tbk", "PT Harta Djaya Karya Tbk",
  "PT Hartadinata Abadi Tbk", "PT Homeco Victoria Makmur Tbk", "PT Hotel Fitra International Tbk", "PT Hotel Mandarine Regency Tbk", "PT Hotel Sahid Jaya International",
  "PT Idea Indonesia Akademi Tbk", "PT Imago Mulia Persada Tbk", "PT Indo Kordsa Tbk", "PT Indo-Rama Synthetics Tbk", "PT Indomobil Sukses Internasional",
  "PT Indospring Tbk", "PT Industri dan Perdagangan Bintr", "PT Inocycle Technology Group Tbk", "PT Integra Indocabinet Tbk", "PT Intermedia Capital Tbk",
  "PT Inti Agri Resources Tbk", "PT Intra Golflink Resorts Tbk", "PT Isra Presisi Indonesia Tbk", "PT Jakarta International Hotels &", "PT Jakarta Setiabudi Internasiona",
  "PT Jaya Bersama Indo Tbk", "PT Kedaung Indah Can Tbk", "PT King Tire Indonesia Tbk", "PT Klinko Karya Imaji Tbk", "PT LG Electronics Indonesia",
  "PT Langgeng Makmur Industri Tbk", "PT Lavender Bina Cendikia Tbk", "PT Lima Dua Lima Tiga Tbk", "PT Lini Imaji Kreasi Ekosistem Tb", "PT Lupromax Pelumas Indonesia Tbk",
  "PT MAP Boga Adiperkasa Tbk", "PT MD Entertainment Tbk", "PT MDTV Media Technologies Tbk", "PT MNC Digital Entertainment Tbk", "PT MNC Land Tbk",
  "PT MNC Sky Vision Tbk", "PT MNC Vision Networks Tbk", "PT Magna Investama Mandiri Tbk", "PT Mahaka Media Tbk", "PT Mahaka Radio Integra Tbk",
  "PT Map Aktif Adiperkasa Tbk", "PT Marga Abhinaya Abadi Tbk", "PT Mas Murni Indonesia Tbk", "PT Matahari Department Store Tbk", "PT Media Nusantara Citra Tbk",
  "PT Mega Perintis Tbk", "PT Menteng Heritage Realty Tbk", "PT Mitra Adiperkasa Tbk", "PT Mitra Angkasa Sejahtera Tbk", "PT Mitra Komunikasi Nusantara Tbk",
  "PT Mitra Pinasthika Mustika Tbk", "PT Multi Indocitra Tbk", "PT Multi Prima Sejahtera Tbk", "PT Multistrada Arah Sarana Tbk", "PT Multitrend Indo Tbk",
  "PT Nipress Tbk", "PT Nusantara Inti Corpora Tbk", "PT Nusantara Sejahtera Raya Tbk", "PT Omni Inovasi Indonesia Tbk", "PT Oscar Mitra Sukses Sejahtera T",
  "PT Pan Brothers Tbk", "PT Panasia Indo Resources Tbk", "PT Panasonic Gobel Indonesia", "PT Panca Anugrah Wisesa Tbk", "PT Panorama Sentrawisata Tbk",
  "PT Pembangunan Graha Lestari Inda", "PT Pembangunan Jaya Ancol Tbk", "PT Pioneerindo Gourmet Internatio", "PT Planet Properindo Jaya Tbk", "PT Prima Alloy Steel Universal Tb",
  "PT Primarindo Asia Infrastructure", "PT Pudjiadi & Sons Tbk", "PT Puri Sentul Permai Tbk", "PT Putra Mandiri Jembar Tbk", "PT Ramayana Lestari Sentosa Tbk",
  "PT Red Planet Indonesia Tbk", "PT Ricky Putra Globalindo Tbk", "PT Rohartindo Nusantara Luas Tbk", "PT Samcro Hyosung Adilestari Tbk", "PT Samsung Electronics Indonesia",
  "PT Sanurhasta Mitra Tbk", "PT Saraswanti Indoland Developmen", "PT Saraswati Griya Lestari Tbk", "PT Sari Kreasi Boga Tbk", "PT Sarimelati Kencana Tbk",
  "PT Satria Mega Kencana Tbk", "PT Sejahtera Bintang Abadi Textil", "PT Selamat Sempurna Tbk", "PT Selaras Citra Nusantara Perkas", "PT Sepatu Bata Tbk",
  "PT Sepeda Bersama Indonesia Tbk", "PT Sinar Eka Selaras Tbk", "PT Sinergi Megah Internusa Tbk", "PT Sona Topas Tourism Industry Tb", "PT Soraya Berjaya Indonesia Tbk",
  "PT Sri Rejeki Isman Tbk", "PT Sunindo Adipersada Tbk", "PT Sunson Textile Manufacture Tbk", "PT Sunter Lakeside Hotel Tbk", "PT Surya Citra Media Tbk",
  "PT Surya Permata Andalan Tbk", "PT Suzuki Indomobil Motor", "PT Tempo Intimedia Tbk", "PT Terang Dunia Internusa Tbk", "PT Tifico Fiber Indonesia Tbk",
  "PT Toyota Motor Manufacturing Indonesia", "PT Trikomsel Oke Tbk", "PT Tripar Multivision Plus Tbk", "PT Trisula International Tbk", "PT Trisula Textile Industries Tbk",
  "PT VKTR Teknologi Mobilitas Tbk", "PT Visi Media Asia Tbk", "PT Yamaha Indonesia Motor Manufacturing", "PT Yelooo Integra Datanet Tbk", "PT Bio Farma (Persero)",
  "PT Bundamedik Tbk", "PT Charlie Hospital Semarang Tbk", "PT Darya-Varia Laboratoria Tbk", "PT Dexa Medica", "PT Diagnos Laboratorium Utama Tbk",
  "PT Famon Awal Bros Sedaya Tbk", "PT Haloni Jane Tbk", "PT Hetzer Medical Indonesia Tbk", "PT Ikapharmindo Putramas Tbk", "PT Indofarma Tbk",
  "PT Industri Jamu dan Farmasi Sido", "PT Itama Ranoraya Tbk", "PT Jayamas Medica Industri Tbk", "PT Kalbe Farma Tbk", "PT Kedoya Adyaraya Tbk",
  "PT Kimia Farma Tbk", "PT Maja Agung Latexindo Tbk", "PT Medikaloka Hermina Tbk", "PT Merck Tbk", "PT Metro Healthcare Indonesia Tbk",
  "PT Mitra Keluarga Karyasehat Tbk", "PT Multi Medika Internasional Tbk", "PT Murni Sadar Tbk", "PT Organon Pharma Indonesia Tbk", "PT Penta Valent Tbk",
  "PT Phapros Tbk", "PT Prodia Widyahusada Tbk", "PT Pyridam Farma Tbk", "PT Royal Prima Tbk", "PT Sarana Meditama Metropolitan T",
  "PT Sejahteraraya Anugrahjaya Tbk", "PT Siloam International Hospitals", "PT Soho Global Health Tbk", "PT Tempo Scan Pacific Tbk", "PT UBC Medical Indonesia Tbk",
  "PT Acset Indonusa Tbk", "PT Adhi Karya (Persero) Tbk", "PT Aesler Grup Internasional Tbk", "PT Arkora Hydro Tbk", "PT Asri Karya Lestari Tbk",
  "PT Bakrie Telecom Tbk", "PT Bali Towerindo Sentra Tbk", "PT Bangun Karya Perkasa Jaya Tbk", "PT Barito Renewables Energy Tbk", "PT Berdikari Pondasi Perkasa Tbk",
  "PT Bukaka Teknik Utama Tbk", "PT Cardig Aero Services Tbk", "PT Centratama Telekomunikasi Indo", "PT Cikarang Listrindo Tbk", "PT Citra Marga Nusaphala Persada",
  "PT Dayamitra Telekomunikasi Tbk", "PT Djasa Ubersakti Tbk", "PT Fimperkasa Utama Tbk", "PT First Media Tbk", "PT Garuda Maintenance Facility Ae",
  "PT Gihon Telekomunikasi Indonesia", "PT Himalaya Energi Perkasa Tbk", "PT Indonesia Kendaraan Terminal T", "PT Indonesia Pondasi Raya Tbk", "PT Indosat Tbk",
  "PT Inti Bangun Sejahtera Tbk", "PT Jasa Armada Indonesia Tbk", "PT Jasa Marga (Persero) Tbk", "PT Jasnita Telekomindo Tbk", "PT Jaya Konstruksi Manggala Prata",
  "PT Kencana Energi Lestari Tbk", "PT Ketrosden Triasmitra Tbk", "PT Koka Indonesia Tbk", "PT LCK Global Kedaton Tbk", "PT Lancartama Sejati Tbk",
  "PT Link Net Tbk", "PT Maharaksa Biru Energi Tbk", "PT Manggung Polahraya Tbk", "PT Megapower Makmur Tbk", "PT Meratus Jasa Prima Tbk",
  "PT Meta Epsi Tbk", "PT Mitra Pemuda Tbk", "PT Mora Telematika Indonesia Tbk", "PT Nusa Konstruksi Enjiniring Tbk", "PT Nusa Raya Cipta Tbk",
  "PT Nusantara Infrastructure Tbk", "PT Nusantara Pelabuhan Handal Tbk", "PT PLN (Persero)", "PT PP (Persero) Tbk", "PT PP Presisi Tbk",
  "PT Paramita Bangun Sarana Tbk", "PT Pertamina Geothermal Energy Tb", "PT Pratama Widya Tbk", "PT Remala Abadi Tbk", "PT Sarana Menara Nusantara Tbk",
  "PT Sinergi Inti Andalan Prima Tbk", "PT Smartfren Telecom Tbk", "PT Solusi Tunas Pratama Tbk", "PT Sumber Mas Konstruksi Tbk", "PT Surya Semesta Internusa Tbk",
  "PT Telkom Indonesia (Persero) Tbk", "PT Terregra Asia Energy Tbk", "PT Total Bangun Persada Tbk", "PT Totalindo Eka Persada Tbk", "PT Tower Bersama Infrastructure T",
  "PT Visi Telekomunikasi Infrastruk", "PT Waskita Karya (Persero) Tbk", "PT Wijaya Karya (Persero) Tbk", "PT Wijaya Karya Bangunan Gedung T", "PT XL Axiata Tbk",
  "PT Adhi Commuter Properti Tbk", "PT Agung Podomoro Land Tbk", "PT Agung Semesta Sejahtera Tbk", "PT Aksara Global Development Tbk", "PT Alam Sutera Realty Tbk",
  "PT Andalan Perkasa Abadi Tbk", "PT Andalan Sakti Primaindo Tbk", "PT Armidian Karyatama Tbk", "PT Bakrieland Development Tbk", "PT Bekasi Asri Pemula Tbk",
  "PT Bekasi Fajar Industrial Estate", "PT Bhakti Agung Propertindo Tbk", "PT Bhuwanatala Indah Permai Tbk", "PT Bima Sakti Pertiwi Tbk", "PT Binakarya Jaya Abadi Tbk",
  "PT Bliss Properti Indonesia Tbk", "PT Bukit Darmo Property Tbk", "PT Bumi Benowo Sukses Sejahtera T", "PT Bumi Citra Permai Tbk", "PT Bumi Serpong Damai Tbk",
  "PT Cahayasakti Investindo Sukses", "PT Capri Nusa Satu Properti Tbk", "PT Ciputra Development Tbk", "PT Citra Buana Prasida Tbk", "PT City Retail Developments Tbk",
  "PT Cowell Development Tbk", "PT Diamond Citra Propertindo Tbk", "PT Duta Anggada Realty Tbk", "PT Duta Pertiwi Tbk", "PT Era Graharealty Tbk",
  "PT Eureka Prima Jakarta Tbk", "PT Fortune Mate Indonesia Tbk", "PT Forza Land Indonesia Tbk", "PT Gowa Makassar Tourism Developm", "PT Graha Mitra Asia Tbk",
  "PT Grand House Mulia Tbk", "PT Hanson International Tbk", "PT Indonesia Prima Property Tbk", "PT Indonesian Paradise Property T", "PT Ingria Pratama Capitalindo Tbk",
  "PT Intiland Development Tbk", "PT Jaya Real Property Tbk", "PT Jaya Sukses Makmur Sentosa Tbk", "PT Karya Bersama Anugerah Tbk", "PT Kawasan Industri Jababeka Tbk",
  "PT Kokoh Exa Nusantara Tbk", "PT Kota Satu Properti Tbk", "PT Lippo Cikarang Tbk", "PT Lippo Karawaci Tbk", "PT Maha Properti Indonesia Tbk",
  "PT Makmur Berkah Amanda Tbk", "PT Mega Manunggal Property Tbk", "PT Megapolitan Developments Tbk", "PT Metro Realty Tbk", "PT Metropolitan Kentjana Tbk",
  "PT Metropolitan Land Tbk", "PT Minahasa Membangun Hebat Tbk", "PT Modernland Realty Tbk", "PT Multisarana Intan Eduka Tbk", "PT Natura City Developments Tbk",
  "PT Nusantara Almazia Tbk", "PT PP Properti Tbk", "PT Pakuan Tbk", "PT Pakuwon Jati Tbk", "PT Pantai Indah Kapuk Dua Tbk",
  "PT Perdana Gapuraprima Tbk", "PT Perintis Triniti Properti Tbk", "PT Pikko Land Development Tbk", "PT Plaza Indonesia Realty Tbk", "PT Pollux Hotels Group Tbk",
  "PT Pollux Properties Indonesia Tb", "PT Pudjiadi Prestige Tbk", "PT Puradelta Lestari Tbk", "PT Puri Global Sukses Tbk", "PT Repower Asia Indonesia Tbk",
  "PT Rimo International Lestari Tbk", "PT Ristia Bintang Mahkotasejati T", "PT Rockfields Properti Indonesia", "PT Roda Vivatex Tbk", "PT Royalindo Investa Wijaya Tbk",
  "PT Saptausaha Gemilangindah Tbk", "PT Sentul City Tbk", "PT Star Pacific Tbk", "PT Summarecon Agung Tbk", "PT Suryamas Dutamakmur Tbk",
  "PT Trimitra Prawara Goldland Tbk", "PT Trimitra Propertindo Tbk", "PT Triniti Dinamik Tbk", "PT Urban Jakarta Propertindo Tbk", "PT Vastland Indonesia Tbk",
  "PT Winner Nusantara Jaya Tbk", "PT Wulandari Bangun Laksana Tbk", "PT Adi Sarana Armada Tbk", "PT AirAsia Indonesia Tbk", "PT Armada Berjaya Trans Tbk",
  "PT Batavia Prosperindo Trans Tbk", "PT Berlian Laju Tanker Tbk", "PT Blue Bird Tbk", "PT Dewata Freightinternational Tb", "PT Eka Sari Lorena Transport Tbk",
  "PT Express Transindo Utama Tbk", "PT Garuda Indonesia (Persero) Tbk", "PT Grahaprima Suksesmandiri Tbk", "PT Guna Timur Raya Tbk", "PT Habco Trans Maritima Tbk",
  "PT Hasnur Internasional Shipping", "PT Indomobil Multi Jasa Tbk", "PT Jasa Berdikari Logistics Tbk", "PT Jaya Trishindo Tbk", "PT Krida Jaringan Nusantara Tbk",
  "PT Logisticsplus International Tb", "PT MPX Logistics International Tb", "PT Mineral Sumberdaya Mandiri Tbk", "PT Mitra International Resources", "PT Mitra Investindo Tbk",
  "PT Pelayaran Kurnia Lautan Semest", "PT Pelayaran Nasional Ekalya Purn", "PT Pelayaran Nelly Dwi Putri Tbk", "PT Prima Globalindo Logistik Tbk", "PT Putra Rajawali Kencana Tbk",
  "PT Samudera Indonesia Tbk", "PT Satria Antaran Prima Tbk", "PT Sidomulyo Selaras Tbk", "PT Steady Safe Tbk", "PT Temas Tbk",
  "PT Transkon Jaya Tbk", "PT Trimuda Nuansa Citra Tbk", "PT Utama Radar Cahaya Tbk", "PT WEHA Transportasi Indonesia Tb", "PT Adaro Andalan Indonesia Tbk",
  "PT Adiwarna Anugerah Abadi Tbk", "PT Asuransi Digital Bersama Tbk", "PT Bangun Kosambi Sukses Tbk", "PT Brigit Biofarmaka Teknologi Tb", "PT Daaz Bara Lestari Tbk",
  "PT Daya Intiguna Yasa Tbk", "PT Delta Giri Wacana Tbk", "PT Esta Indonesia Tbk", "PT Global Sukses Digital Tbk", "PT Hero Global Investment Tbk",
  "PT Kentanix Supra International T", "PT Master Print Tbk", "PT Newport Marine Services Tbk", "PT Raharja Energi Cepu Tbk", "PT Raja Roti Cemerlang Tbk",
  "PT Verona Indah Pictures Tbk", "PT Adira Dinamika Multi Finance T", "PT Allo Bank Indonesia Tbk", "PT Ashmore Asset Management Indon", "PT Asuransi Bina Dana Arta Tbk",
  "PT Asuransi Bintang Tbk", "PT Asuransi Dayin Mitra Tbk", "PT Asuransi Harta Aman Pratama Tb", "PT Asuransi Jasa Tania Tbk", "PT Asuransi Jiwa Syariah Jasa Mit",
  "PT Asuransi Maximus Graha Persada", "PT Asuransi Multi Artha Guna Tbk", "PT Asuransi Ramayana Tbk", "PT Asuransi Tugu Pratama Indonesi", "PT BFI Finance Indonesia Tbk",
  "PT Bank Aladin Syariah Tbk", "PT Bank Amar Indonesia Tbk", "PT Bank Artha Graha Internasional", "PT Bank BTPN Syariah Tbk", "PT Bank Bumi Arta Tbk",
  "PT Bank CIMB Niaga Tbk", "PT Bank Capital Indonesia Tbk", "PT Bank Central Asia Tbk", "PT Bank China Construction Bank I", "PT Bank Danamon Indonesia Tbk",
  "PT Bank Ganesha Tbk", "PT Bank IBK Indonesia Tbk", "PT Bank Ina Perdana Tbk", "PT Bank JTrust Indonesia Tbk", "PT Bank Jago Tbk",
  "PT Bank KB Bukopin Tbk", "PT Bank MNC Internasional Tbk", "PT Bank Mandiri (Persero) Tbk", "PT Bank Maspion Indonesia Tbk", "PT Bank Mayapada Internasional Tb",
  "PT Bank Maybank Indonesia Tbk", "PT Bank Mega Tbk", "PT Bank Mestika Dharma Tbk", "PT Bank Multiarta Sentosa Tbk", "PT Bank Nationalnobu Tbk",
  "PT Bank Negara Indonesia (Persero", "PT Bank Neo Commerce Tbk", "PT Bank OCBC NISP Tbk", "PT Bank Of India Indonesia Tbk", "PT Bank Oke Indonesia Tbk",
  "PT Bank Pan Indonesia Tbk", "PT Bank Panin Dubai Syariah Tbk", "PT Bank Pembangunan Daerah Banten", "PT Bank Pembangunan Daerah Jawa B", "PT Bank Pembangunan Daerah Jawa T",
  "PT Bank Permata Tbk", "PT Bank QNB Indonesia Tbk", "PT Bank Rakyat Indonesia (Persero", "PT Bank Raya Indonesia Tbk", "PT Bank SMBC Indonesia Tbk",
  "PT Bank Sinarmas Tbk", "PT Bank Syariah Indonesia Tbk", "PT Bank Tabungan Negara (Persero)", "PT Bank Victoria International Tb", "PT Bank Woori Saudara Indonesia 1",
  "PT Batavia Prosperindo Internasio", "PT Bhakti Multi Artha Tbk", "PT Buana Artha Anugerah Tbk", "PT Buana Finance Tbk", "PT Capital Financial Indonesia Tb",
  "PT Charnic Capital Tbk", "PT Clipan Finance Indonesia Tbk", "PT Danasupra Erapacific Tbk", "PT Equity Development Investment", "PT Fuji Finance Indonesia Tbk",
  "PT Indoritel Makmur Internasional", "PT KDB Tifa Finance Tbk", "PT Krom Bank Indonesia Tbk", "PT Lenox Pasifik Investama Tbk", "PT Lippo General Insurance Tbk",
  "PT MNC Kapital Indonesia Tbk", "PT MSIG Life Insurance Indonesia", "PT Malacca Trust Wuwungan Insuran", "PT Mandala Multifinance Tbk", "PT Maskapai Reasuransi Indonesia",
  "PT Minna Padi Investama Sekuritas", "PT Mizuho Leasing Indonesia Tbk", "PT Onix Capital Tbk", "PT Pacific Strategic Financial Tb", "PT Panca Global Kapital Tbk",
  "PT Panin Financial Tbk", "PT Panin Sekuritas Tbk", "PT Paninvest Tbk", "PT Polaris Investama Tbk", "PT Pool Advista Finance Tbk",
  "PT Pool Advista Indonesia Tbk", "PT Provident Investasi Bersama Tb", "PT Radana Bhaskara Finance Tbk", "PT Reliance Sekuritas Indonesia T", "PT Saratoga Investama Sedaya Tbk",
  "PT Sinarmas Multiartha Tbk", "PT Surya Fajar Capital Tbk", "PT Trimegah Sekuritas Indonesia T", "PT Trust Finance Indonesia Tbk", "PT Venteny Fortuna International",
  "PT Victoria Insurance Tbk", "PT Victoria Investama Tbk", "PT Wahana Ottomitra Multiartha Tb", "PT Woori Finance Indonesia Tbk", "PT Yulie Sekuritas Indonesia Tbk",
  "PT Anabatic Technologies Tbk", "PT Aviana Sinar Abadi Tbk", "PT Bukalapak.com Tbk", "PT Cashlez Worldwide Indonesia Tb", "PT DCI Indonesia Tbk",
  "PT Data Sinergitama Jaya Tbk", "PT Digital Mediatama Maxima Tbk", "PT Distribusi Voucher Nusantara T", "PT Dunia Virtual Online Tbk", "PT Elang Mahkota Teknologi Tbk",
  "PT Envy Technologies Indonesia Tb", "PT Era Digital Media Tbk", "PT Galva Technologies Tbk", "PT Global Digital Niaga Tbk", "PT Global Sukses Solusi Tbk",
  "PT GoTo Gojek Tokopedia Tbk", "PT Hensel Davest Indonesia Tbk", "PT ITSEC Asia Tbk", "PT Indointernet Tbk", "PT Indosterling Technomedia Tbk",
  "PT Informasi Teknologi Indonesia", "PT Kioson Komersial Indonesia Tbk", "PT Lazada Indonesia", "PT Limas Indonesia Makmur Tbk", "PT M Cash Integrasi Tbk",
  "PT Mastersystem Infotama Tbk", "PT Menn Teknologi Indonesia Tbk", "PT Metrodata Electronics Tbk", "PT Mitra Pedagang Indonesia Tbk", "PT Multipolar Technology Tbk",
  "PT NFC Indonesia Tbk", "PT Northcliff Citranusa Indonesia", "PT Pelita Teknologi Global Tbk", "PT Quantum Clovera Investama Tbk", "PT Sat Nusapersada Tbk",
  "PT Sentral Mitra Informatika Tbk", "PT Shopee International Indonesia", "PT Solusi Sinergi Digital Tbk", "PT Sumber Sinergi Makmur Tbk", "PT Techno9 Indonesia Tbk",
  "PT Teknologi Karya Digital Nusa T", "PT Telefast Indonesia Tbk", "PT Tera Data Indonusa Tbk", "PT Tokopedia", "PT Topindo Solusi Komunika Tbk",
  "PT Tourindo Guide Indonesia Tbk", "PT Trimegah Karya Pratama Tbk", "PT WIR ASIA Tbk", "PT Wira Global Solusi Tbk", "PT Zyrexindo Mandiri Buana Tbk"
];

const SEED_CUSTOMERS = [
  ['C001',COMPANY_NAMES[0],'CTR-1001',10,70,7,30,130000000,'2026-10-20'],
  ['C002',COMPANY_NAMES[1],'CTR-1002',10,85,4,15,115000000,'2026-10-24'],
  ['C003',COMPANY_NAMES[2],'CTR-1003',10,100,1,5,105000000,'2026-10-26'],
  ['C004',COMPANY_NAMES[3],'CTR-1004',4,75,null,10,50000000,'2026-10-22'],
  ['C005',COMPANY_NAMES[4],'CTR-1005',12,65,9,35,160000000,'2026-10-21'],
  ['C006',COMPANY_NAMES[5],'CTR-1006',12,96,1,8,85000000,'2026-10-28'],
  ['C007',COMPANY_NAMES[6],'CTR-1007',10,82,3,18,98000000,'2026-10-25'],
  ['C008',COMPANY_NAMES[7],'CTR-1008',8,92,6,22,142000000,'2026-10-23'],
];

const SEED_ALERTS = [
  ['ALT-001','C001','INV-001','2026-10-20','2026-10-13','Red','Collection Officer A','Pending'],
  ['ALT-002','C002','INV-002','2026-10-24','2026-10-19','Yellow','Collection Officer B','Responded'],
  ['ALT-003','C005','INV-003','2026-10-21','2026-10-15','Red','Collection Officer A','Breached'],
  ['ALT-004','C008','INV-004','2026-10-23','2026-10-17','Red','Collection Officer C','Pending'],
  ['ALT-005','C007','INV-005','2026-10-25','2026-10-20','Yellow','Collection Officer B','Responded'],
];

const SEED_SOURCES = [
  ['SRC-01','Official Legal Records (SIPP)','LEGAL',1,1,'2026-10-10'],
  ['SRC-02','Corporate Disclosures (IDX)','FINANCIAL',1,1,'2026-10-10'],
  ['SRC-03','Company Announcements','OPERATIONAL',1,1,'2026-10-10'],
  ['SRC-04','Industry Statistics (BPS)','INDUSTRY',1,1,'2026-10-09'],
  ['SRC-05','Unapproved Source','NEWS',0,1,'TBD'],
];

const SEED_EVIDENCE = [
  ['EV-001','C001','SRC-03','Operational disruption','OPERATIONAL','High','High',1,'Matched','[0,80,100,50]','2026-10-08','2026-10-08','Corporate notice describing temporary disruption.'],
  ['EV-002','C002','SRC-02','Financial pressure','FINANCIAL','Medium','High',1,'Matched','[0,50,40,50]','2026-10-07','2026-10-07','Disclosure about operating cost increases.'],
  ['EV-003','C005','SRC-01','Legal proceeding — review','LEGAL','High','High',1,'Matched','[100,80,60,50]','2026-10-09','2026-10-09','Legal event tied to restructuring.'],
  ['EV-004','C007','SRC-04','Industry pressure','INDUSTRY','Low','High',1,'Matched','[0,0,0,20]','2026-10-09','2026-10-09','Sector conditions.'],
  ['EV-005','C008','SRC-03','Corporate identity ambiguity','OPERATIONAL','Medium','Low',0,'Uncertain',null,'2026-10-10','2026-10-10','Ambiguous name match.'],
  ['EV-006','C003','SRC-05','Unverified negative report','FINANCIAL','High','Low',0,'Matched',null,'2026-10-10','2026-10-10','Unapproved source.'],
  ['EV-007','C006','SRC-03','Verified operational change','OPERATIONAL','Medium','High',1,'Matched','[0,50,70,20]','2026-10-09','2026-10-09','Schedule changes.'],
];

const DB_KEY = 'ari_db_v5';
let _db = null;

async function dbInit(onProgress) {
  const report = (p, t) => onProgress && onProgress(p, t);
  report(10, 'Loading SQLite engine...');
  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`,
  });
  report(40, 'Opening database...');
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try {
      _db = new SQL.Database(new Uint8Array(JSON.parse(saved)));
      report(70, 'Database restored');
      return;
    } catch (e) { console.warn('Restore failed:', e); }
  }
  _db = new SQL.Database();
  dbCreateSchema();
  dbSeed();
  report(70, 'Database initialized');
}

function dbCreateSchema() {
  _db.run(`
    CREATE TABLE customers(id TEXT PRIMARY KEY,name TEXT,contract TEXT,invoices INTEGER,rate REAL,delay REAL,growth REAL,exposure REAL,due TEXT);
    CREATE TABLE alerts(id TEXT PRIMARY KEY,customer_id TEXT,invoice TEXT,due TEXT,created TEXT,risk TEXT,officer TEXT,status TEXT,evidence_id TEXT);
    CREATE TABLE actions(id TEXT PRIMARY KEY,alert_id TEXT,type TEXT,notes TEXT,timestamp TEXT);
    CREATE TABLE evidence(id TEXT PRIMARY KEY,customer_id TEXT,source_id TEXT,event TEXT,category TEXT,severity TEXT,confidence TEXT,verified INTEGER,match_status TEXT,score TEXT,published TEXT,available TEXT,summary TEXT,ai_provider TEXT);
    CREATE TABLE sources(id TEXT PRIMARY KEY,name TEXT,category TEXT,approved INTEGER,available INTEGER,updated TEXT);
    CREATE TABLE reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id TEXT,contract TEXT,action TEXT,notes TEXT,timestamp TEXT);
    CREATE TABLE audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,time TEXT,item TEXT,event TEXT);
    CREATE TABLE scrape_log(id INTEGER PRIMARY KEY AUTOINCREMENT,time TEXT,customer TEXT,source TEXT,status TEXT,details TEXT);
    CREATE TABLE ai_log(id INTEGER PRIMARY KEY AUTOINCREMENT,time TEXT,operation TEXT,model TEXT,customer TEXT,status TEXT,details TEXT,duration_ms INTEGER);
  `);
}

function dbSeed() {
  const ic = _db.prepare('INSERT OR REPLACE INTO customers VALUES(?,?,?,?,?,?,?,?,?)');
  SEED_CUSTOMERS.forEach(r => ic.run(r)); ic.free();

  const ia = _db.prepare('INSERT OR REPLACE INTO alerts VALUES(?,?,?,?,?,?,?,?,?)');
  SEED_ALERTS.forEach(r => ia.run([...r, null])); ia.free();

  const is = _db.prepare('INSERT OR REPLACE INTO sources VALUES(?,?,?,?,?,?)');
  SEED_SOURCES.forEach(r => is.run(r)); is.free();

  const ie = _db.prepare('INSERT OR REPLACE INTO evidence VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  SEED_EVIDENCE.forEach(r => ie.run([...r, 'seed'])); ie.free();

  _db.run("INSERT INTO audit_log(time,item,event) VALUES(?,?,?)",
    ['2026-10-10','System','Database initialized']);
  dbPersist();
}

function dbSeedBulk(onProgress) {
  const report = (p, t) => onProgress && onProgress(p, t);
  
  const officers = ['Collection Officer A','Collection Officer B','Collection Officer C','Collection Officer D','Collection Officer E'];
  const statuses = ['Pending','Responded','Breached','Responded','Pending'];
  const risks = ['Red','Yellow','Green','Yellow','Red'];
  const categories = ['LEGAL','FINANCIAL','OPERATIONAL','INDUSTRY'];
  const severities = ['Low','Medium','High'];
  const eventsByCat = {
    LEGAL: ['PKPU filing detected','Court case filed','Restructuring proceeding'],
    FINANCIAL: ['Cash flow pressure report','Cost increase disclosure','Liquidity concern'],
    OPERATIONAL: ['Fleet schedule disruption','Driver shortage','Service interruption'],
    INDUSTRY: ['Sector slowdown','Industry volume decline','Regulatory change'],
  };
  const sources = ['SRC-01','SRC-02','SRC-03','SRC-04'];

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const dateStr = (offsetDays) => {
    const d = new Date(2026, 9, 17);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  const C = [], A = [], E = [];
  const TOTAL = 1000;

  for (let i = 0; i < TOTAL; i++) {
    if (i % 100 === 0) report(Math.floor(i / TOTAL * 60), `Generating customer ${i}/${TOTAL}...`);
    const id = 'C' + String(i + 1).padStart(4, '0');
    
    // Use fixed names from Excel, not random
    const name = COMPANY_NAMES[i];
    
    const contract = 'CTR-' + (1001 + i);
    const invoices = rnd(2, 20);
    const rate = rnd(45, 100);
    const delay = Math.random() < 0.2 ? null : rnd(0, 15);
    const growth = rnd(-10, 55);
    const exposure = rnd(20000000, 250000000);
    const due = dateStr(rnd(-5, 30));
    C.push([id, name, contract, invoices, rate, delay, growth, exposure, due]);

    if (Math.random() < 0.15) {
      const inv = 'INV-' + String(i * 10 + rnd(1, 5)).padStart(6, '0');
      A.push([
        'ALT-' + String(1000 + A.length),
        id, inv, due, dateStr(rnd(-15, -1)),
        pick(risks), pick(officers), pick(statuses), null
      ]);
    }

    if (Math.random() < 0.1) {
      const cat = pick(categories);
      const sev = pick(severities);
      const scoreArr = cat === 'LEGAL' ? [rnd(50,100),rnd(30,80),rnd(20,70),rnd(10,50)]
                     : cat === 'FINANCIAL' ? [rnd(0,30),rnd(30,80),rnd(20,60),rnd(10,50)]
                     : cat === 'OPERATIONAL' ? [rnd(0,30),rnd(20,60),rnd(40,90),rnd(10,40)]
                     : [rnd(0,20),rnd(0,20),rnd(0,30),rnd(30,90)];
      const conf = pick(['High','High','Medium','Low']);
      const verified = conf === 'High' ? 1 : 0;
      E.push([
        'EV-' + String(1000 + E.length),
        id, pick(sources),
        pick(eventsByCat[cat]), cat, sev, conf,
        verified, 'Matched', JSON.stringify(scoreArr),
        dateStr(rnd(-20, -1)), dateStr(rnd(-20, -1)),
        `Simulated evidence for ${name} · ${cat}`,
        'seed'
      ]);
    }
  }

  report(70, 'Inserting customers...');
  _db.run('BEGIN TRANSACTION');
  const ic = _db.prepare('INSERT OR REPLACE INTO customers VALUES(?,?,?,?,?,?,?,?,?)');
  C.forEach(r => ic.run(r)); ic.free();

  report(80, 'Inserting alerts...');
  const ia = _db.prepare('INSERT OR REPLACE INTO alerts VALUES(?,?,?,?,?,?,?,?,?)');
  A.forEach(r => ia.run(r)); ia.free();

  report(88, 'Inserting evidence...');
  const ie = _db.prepare('INSERT OR REPLACE INTO evidence VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  E.forEach(r => ie.run(r)); ie.free();
  _db.run('COMMIT');

  _db.run("INSERT INTO audit_log(time,item,event) VALUES(?,?,?)",
    [new Date().toISOString(), 'Bulk Seed', `Generated ${C.length} customers, ${A.length} alerts, ${E.length} evidence`]);
  dbPersist();
  report(95, 'Done');
  return { customers: C.length, alerts: A.length, evidence: E.length };
}

function dbPersist() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(Array.from(_db.export()))); }
  catch (e) { console.warn('Persist failed:', e); }
}

function dbQuery(sql, params = []) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function dbExec(sql, params = []) {
  _db.run(sql, params);
  dbPersist();
}

function dbReset() {
  localStorage.removeItem(DB_KEY);
  location.reload();
}

// ================== KPI ==================
const KPI = {
  K02(o, t) { if (!t) return { value: null, level: 'Undefined' }; const v = (o/t)*100; return { value: v, level: v<10?'Green':v<=20?'Yellow':'Red' }; },
  K06(on, t) { if (!t) return { value: null, level: 'Insufficient' }; const v = (on/t)*100; return { value: v, level: v>=95?'Green':v>=80?'Yellow':'Red' }; },
  K07(l, p, n) { if (n<6) return { value: null, level: 'Insufficient' }; const v = l-p; return { value: v, level: v<=2?'Green':v<=5?'Yellow':'Red' }; },
  K10(c, p) { if (!p) return { value: null, level: 'Undefined' }; const v = ((c-p)/p)*100; return { value: v, level: v<=10?'Green':v<=20?'Yellow':'Red' }; },
  K15(a, t) { if (!t) return { value: null, level: 'Insufficient' }; const v = (a/t)*100; return { value: v, level: v>=95?'Green':v>=85?'Yellow':'Red' }; },
  K17(w, a) { if (!a) return { value: null, level: 'Insufficient' }; const v = (w/a)*100; return { value: v, level: v>=90?'Green':v>=75?'Yellow':'Red' }; },
  K21(tp, fn) { if (tp+fn===0) return { value: null, level: 'N/A' }; const v = (tp/(tp+fn))*100; return { value: v, level: v>=60?'Green':v>=40?'Yellow':'Red' }; },
  K22(tp, fp) { if (tp+fp===0) return { value: null, level: 'Undefined' }; const v = (tp/(tp+fp))*100; return { value: v, level: v>=50?'Green':v>=30?'Yellow':'Red' }; },
  K24(p) {
    const v = p.filter(x => x.due && x.fa);
    if (!v.length) return { value: null, level: 'N/A' };
    const s = v.reduce((a, x) => a + Math.round((Date.parse(x.due)-Date.parse(x.fa))/86400000), 0);
    const val = Math.round(s/v.length);
    return { value: val, level: val>=5?'Green':val>=2?'Yellow':'Red' };
  },
  computeAll() {
    const c = dbQuery('SELECT * FROM customers');
    const a = dbQuery('SELECT * FROM alerts');
    const total = c.reduce((s, x) => s + x.exposure, 0);
    const avgR = c.length ? c.reduce((s, x) => s + x.rate, 0) / c.length : 0;
    const dly = c.filter(x => x.delay !== null && x.delay !== undefined);
    const avgD = dly.length ? dly.reduce((s, x) => s + x.delay, 0) / dly.length : 0;
    const avgG = c.length ? c.reduce((s, x) => s + x.growth, 0) / c.length : 0;
    return {
      K02: this.K02(total*0.15, total),
      K06: this.K06(avgR, 100),
      K07: this.K07(avgD, 0, 6),
      K10: this.K10(avgG+100, 100),
      K15: this.K15(c.length, c.length),
      K17: this.K17(a.filter(x => x.status==='Responded').length, a.length || 1),
      K21: this.K21(6, 4),
      K22: this.K22(5, 5),
      K24: this.K24(a.map(x => ({ due: x.due, fa: x.created }))),
    };
  },
};

// ================== RISK ==================
const Risk = {
  calculate(rate, delay, growth) {
    const vals = [rate, delay, growth];
    if (vals.some(v => v === '' || v === null || v === undefined || isNaN(v)))
      return { value: null, level: 'Insufficient', insufficient: true, reason: 'All indicators are required.' };
    const r = Number(rate), d = Number(delay), g = Number(growth);
    if (r < 0 || r > 100)
      return { value: null, level: 'Invalid', insufficient: true, reason: 'On-time rate 0–100%.' };
    const pS = r>=95?0:r>=80?50:100;
    const dS = d<=2?0:d<=5?50:100;
    const gS = g<=10?0:g<=20?50:100;
    const value = Math.round((pS*0.4 + dS*0.4 + gS*0.2)*100)/100;
    return { value, level: value<30?'Green':value<60?'Yellow':'Red', components: [pS, dS, gS], insufficient: false };
  },
  fromCustomer(c) {
    if (c.invoices < 6 || c.delay === null || c.delay === undefined)
      return { value: null, level: 'Insufficient', reason: 'Requires 6 settled invoices.' };
    return this.calculate(c.rate, c.delay, c.growth);
  },
};

window.ARIDB = { init: dbInit, query: dbQuery, exec: dbExec, reset: dbReset, seedBulk: dbSeedBulk, persist: dbPersist };
window.ARIKPI = KPI;
window.ARIRisk = Risk;