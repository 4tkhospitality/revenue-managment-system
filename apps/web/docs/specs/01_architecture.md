# System Architecture

```mermaid
graph TD
    User[User / CSV Import] -->|Upload| API_Import[API: /import-jobs]
    API_Import -->|Parse & Validate| Ingest[Action: ingestCSV]
    Ingest -->|Write| DB_Raw[DB: reservations_raw]
    
    subgraph Core Processing
        DB_Raw -->|Trigger / Schedule| OTB_Builder[Action: buildDailyOTB]
        OTB_Builder -->|Time-Travel Aggregation| DB_OTB[DB: daily_otb]
    end
    
    subgraph Pricing Engine
        DB_OTB -->|Supply Input| Pricing_Eng[Action: runPricingEngine]
        DB_Forecast[DB: demand_forecast] -->|Demand Input| Pricing_Eng
        Pricing_Eng -->|Generate| DB_Recs[DB: price_recommendations]
    end
    
    subgraph User Decision
        DB_Recs -->|Display| UI_Pricing[UI: Pricing Grid]
        UI_Pricing -->|Accept / Override| API_Decide[API: /pricing/decide]
        API_Decide -->|Log| DB_Decisions[DB: pricing_decisions]
    end

    subgraph Rate Shopper (External)
        SerpApi[SerpApi] -->|Scrape| Rate_Shopper[Action: fetchCompetitors]
        Rate_Shopper -->|Cache| DB_Comp[DB: competitor_rates]
        DB_Comp -->|Context| UI_Pricing
    end
```

## Data Flow Summary
1.  **Ingestion**: Raw CSV data is validated and stored in `reservations_raw`.
2.  **Transformation (OTB)**: Raw bookings are expanded into daily stats (rooms/revenue) in `daily_otb`, supporting "as-of" time-travel analysis.
3.  **Pricing Analysis**: The engine combines OTB supply data with Demand Forecasts to recommend prices based on BAR/NET logic.
4.  **Decision**: Users review recommendations and make final pricing decisions, which are logged for audit and PMS sync (future).
