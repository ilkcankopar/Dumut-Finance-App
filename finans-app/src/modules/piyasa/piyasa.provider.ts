import axios from "axios";
import {config} from "@config/app.config";
import {logger} from "@config/logger.config";
import { symbol } from "zod/v4";


export const piyasaProvider = {

    async bist100cek() : Promise<BistHisse[]> {
    try {
    const collectApiKey = process.env.COLLECT_API_KEY || config.finans.collectApiKey;
    const response = await axios.get(
    "https://api.collectapi.com/economy/hisseSenedi",
    {
    headers : {
    "content-type" : "application/json",
    authorization: `apikey ${collectApiKey}`,
    
    },
    params : {gunluk : true , hisse : 'XU100'},
    timeout : 10000
    }
    
    );

            return response.data.result ?? [];
        } catch(error) {
         logger.error("[Piyasa] BİST 100 çekme hatası:", error);
      return [];
        }
    },

    async bistHisseCek(sembol : string) : Promise<BistHisse | null> {
        try{
            const collectApiKey = process.env.COLLECT_API_KEY || config.finans.collectApiKey;
            const response = await axios.get("https://api.collectapi.com/economy/hisseSenedi",
                {
                    headers : {
                        "content-type" : "application/json",
                        authorization: `apikey ${collectApiKey}`,
                  },
                  params : { gunluk : true , hisse :sembol},
                  timeout : 10000
                }
            );

            const list = response.data.result ?? [];
            const found = list.find((item: any) => item.code?.toUpperCase() === sembol.toUpperCase() || item.text?.toUpperCase().startsWith(sembol.toUpperCase()));
            return found ?? list[0] ?? null;
        } catch(error){
            logger.error(`[Piyasa] BİST hisse çekme hatası (${sembol}):`, error);
            return null;
        }
    },


     async yabanciHisseCek(sembol: string): Promise<YabanciHisse | null> {
    try {
      const response = await axios.get(
        "https://www.alphavantage.co/query",
        {
          params: {
            function: "GLOBAL_QUOTE",
            symbol: sembol,
            apikey: config.finans.alphaVantageKey,
          },
          timeout: 10000,
        }
      );

      const quote = response.data["Global Quote"];
      if (!quote || !quote["01. symbol"]) return null;

      return {
        sembol: quote["01. symbol"],
        alis: parseFloat(quote["05. price"]),
        satis: parseFloat(quote["05. price"]),
        kapanis: parseFloat(quote["08. previous close"]),
        acilis: parseFloat(quote["02. open"]),
        enYuksek: parseFloat(quote["03. high"]),
        enDusuk: parseFloat(quote["04. low"]),
        hacim: parseFloat(quote["06. volume"]),
        degisimYuzde: parseFloat(
          quote["10. change percent"].replace("%", "")
        ),
      };
    } catch (error) {
      logger.error(
        `[Piyasa] Yabancı hisse çekme hatası (${sembol}):`,
        error
      );
      return null;
    }
  },


    async kriptoCek(geckoIds: string[]): Promise<KriptoVeri[]> {
    try {
      const response = await axios.get(
        `${config.finans.coinGeckoUrl}/simple/price`,
        {
          params: {
            ids: geckoIds.join(","),
            vs_currencies: "usd,try",
            include_24hr_change: true,
            include_7d_change: true,
            include_market_cap: true,
            include_24hr_vol: true,
          },
          timeout: 10000,
        }
      );

      return Object.entries(response.data).map(([id, veri]: any) => ({
        geckoId: id,
        usdFiyat: veri.usd,
        tryFiyat: veri.try,
        degisim24s: veri.usd_24h_change ?? 0,
        degisim7g: veri.usd_7d_change ?? 0,
        piyasaDegeri: veri.usd_market_cap,
        hacim24s: veri.usd_24h_vol,
      }));
    } catch (error) {
      logger.error("[Piyasa] Kripto çekme hatası:", error);
      return [];
    }
  },


    async kriptoListesiCek(limit = 50): Promise<KriptoListeItem[]> {
    try {
      const response = await axios.get(
        `${config.finans.coinGeckoUrl}/coins/markets`,
        {
          params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: limit,
            page: 1,
            sparkline: false,
            price_change_percentage: "24h,7d",
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error("[Piyasa] Kripto listesi çekme hatası:", error);
      return [];
    }
  },


    async dovizKurlariCek(): Promise<DovizVeri[]> {
    try {
      const collectApiKey = process.env.COLLECT_API_KEY || config.finans.collectApiKey;
      const response = await axios.get(
        "https://api.collectapi.com/economy/allCurrency",
        {
          headers: {
            "content-type": "application/json",
            authorization: `apikey ${collectApiKey}`,
          },
          timeout: 10000,
        }
      );

      return response.data.result ?? [];
    } catch (error) {
      logger.error("[Piyasa] Döviz çekme hatası:", error);
      return [];
    }
  },

  async altinGumuscek(): Promise<AltinGumusVeri[]> {
    try {
      const collectApiKey = process.env.COLLECT_API_KEY || config.finans.collectApiKey;
      const response = await axios.get(
        "https://api.collectapi.com/economy/goldPrice",
        {
          headers: {
            "content-type": "application/json",
            authorization: `apikey ${collectApiKey}`,
          },
          timeout: 10000,
        }
      );

      return response.data.result ?? [];
    } catch (error) {
      logger.error("[Piyasa] Altın/Gümüş çekme hatası:", error);
      return [];
    }
  },

  async gumusFiyatiCek(): Promise<AltinGumusVeri[]> {
    try {
      const collectApiKey = process.env.COLLECT_API_KEY || config.finans.collectApiKey;
      const response = await axios.get(
        "https://api.collectapi.com/economy/silverPrice",
        {
          headers: {
            "content-type": "application/json",
            authorization: `apikey ${collectApiKey}`,
          },
          timeout: 10000,
        }
      );

      return response.data.result ?? [];
    } catch (error) {
      logger.error("[Piyasa] Gümüş çekme hatası:", error);
      return [];
    }
  },

  async bist100EndeksCek(): Promise<BistEndeks | null> {
    try {
      const collectApiKey = process.env.COLLECT_API_KEY || config.finans.collectApiKey;
      const response = await axios.get(
        "https://api.collectapi.com/economy/bpiIndex",
        {
          headers: {
            "content-type": "application/json",
            authorization: `apikey ${collectApiKey}`,
          },
          timeout: 10000,
        }
      );

      const result = response.data.result;
      if (!result) return null;

      return {
        deger: result.lastprice || result.value,
        degisim: result.rate || result.change,
        degisimYuzde: result.ratePercent || result.changePercent,
        tarih: result.date || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[Piyasa] BİST100 endeks çekme hatası:", error);
      return null;
    }
  },





};

export interface BistHisse {
code: string; // "TRALT" gibi sembol
text: string; // "TURK ALTIN ISLETMELARI" gibi ad
rate: number; // Değişim yüzdesi (1.46 gibi)
lastprice: number; // Son fiyat
lastpricestr: string; // Fiyat string ("47,40")
buying?: string; // Alış
selling?: string; // Satış
hacim?: number; // Hacim
hacimstr?: string; // Hacim string
min?: number; // Günlük düşük
max?: number; // Günlük yüksek
time?: string; // Saat
icon?: string; // İkon URL
}

export interface YabanciHisse{
    sembol : string;
    alis: number;
    satis : number;
    kapanis : number;
    acilis : number;
    enYuksek : number;
    enDusuk : number;
    hacim : number;
    degisimYuzde : number;
}


export interface KriptoVeri {
    geckoId : string;
    usdFiyat : number;
    tryFiyat : number;
    degisim24s : number;
    degisim7g : number;
    piyasaDegeri? : number;
    hacim24s : number;
}

export interface KriptoListeItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  image: string;
}
export interface DovizVeri {
  code: string;       // "USD"
  buying: string;     // Alış kuru
  selling: string;    // Satış kuru
  name: string;       // "ABD Doları"
}

export interface AltinGumusVeri {
  name: string;       // "Gram Altın", "Gümüş" vs
  buying: string;     // Alış
  selling: string;    // Satış
  rate?: number;      // Değişim yüzdesi
  datetime?: string;  // Tarih/saat
}

export interface BistEndeks {
  deger: number;
  degisim: number;
  degisimYuzde: number;
  tarih: string;
}