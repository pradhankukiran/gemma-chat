const TIMEOUT = 10000

function withTimeout(signal) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)
  if (signal) signal.addEventListener("abort", () => controller.abort())
  return { signal: controller.signal, clear: () => clearTimeout(timeout) }
}

export async function searchDrugLabels(query) {
  if (!query?.trim()) return { error: "No search query provided" }
  const { signal, clear } = withTimeout()
  try {
    const encoded = encodeURIComponent(query.trim())
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encoded}+openfda.generic_name:${encoded}&limit=3`,
      { signal }
    )
    if (!res.ok) throw new Error(`FDA API returned ${res.status}`)
    const data = await res.json()
    return {
      results: (data.results || []).map((r) => ({
        brandName: r.openfda?.brand_name?.[0] || "Unknown",
        genericName: r.openfda?.generic_name?.[0] || "Unknown",
        manufacturer: r.openfda?.manufacturer_name?.[0] || "Unknown",
        indications: r.indications_and_usage?.[0]?.slice(0, 500) || null,
        warnings: r.warnings?.[0]?.slice(0, 500) || null,
        dosage: r.dosage_and_administration?.[0]?.slice(0, 500) || null,
        contraindications: r.contraindications?.[0]?.slice(0, 500) || null,
      })),
    }
  } catch (err) {
    if (err.name === "AbortError") return { error: "Request timed out" }
    return { error: err.message }
  } finally {
    clear()
  }
}

export async function searchAdverseEvents(drug) {
  if (!drug?.trim()) return { error: "No drug name provided" }
  const { signal, clear } = withTimeout()
  try {
    const encoded = encodeURIComponent(drug.trim())
    const res = await fetch(
      `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:${encoded}&limit=5`,
      { signal }
    )
    if (!res.ok) throw new Error(`FDA Adverse Events API returned ${res.status}`)
    const data = await res.json()
    return {
      results: (data.results || []).map((r) => ({
        reactions: (r.patient?.reaction || []).map((rx) => rx.reactionmeddrapt).filter(Boolean),
        serious: r.serious === "1",
        seriousReasons: [
          r.seriousnessdeath === "1" && "Death",
          r.seriousnesslifethreatening === "1" && "Life-threatening",
          r.seriousnesshospitalization === "1" && "Hospitalization",
          r.seriousnessdisabling === "1" && "Disability",
        ].filter(Boolean),
        receiveDate: r.receivedate || null,
        outcome: r.patient?.reaction?.[0]?.reactionoutcome || null,
      })),
    }
  } catch (err) {
    if (err.name === "AbortError") return { error: "Request timed out" }
    return { error: err.message }
  } finally {
    clear()
  }
}

export async function searchPubMed(query, max = 5) {
  if (!query?.trim()) return { error: "No search query provided" }
  const { signal, clear } = withTimeout()
  try {
    const encoded = encodeURIComponent(query.trim())
    const searchRes = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encoded}&retmax=${max}&retmode=json`,
      { signal }
    )
    if (!searchRes.ok) throw new Error(`PubMed search returned ${searchRes.status}`)
    const searchData = await searchRes.json()
    const ids = searchData.esearchresult?.idlist || []
    if (ids.length === 0) return { results: [] }

    const summaryRes = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`,
      { signal }
    )
    if (!summaryRes.ok) throw new Error(`PubMed summary returned ${summaryRes.status}`)
    const summaryData = await summaryRes.json()

    return {
      results: ids.map((id) => {
        const article = summaryData.result?.[id]
        if (!article) return null
        return {
          pmid: id,
          title: article.title || "Untitled",
          authors: (article.authors || []).slice(0, 3).map((a) => a.name).join(", "),
          journal: article.fulljournalname || article.source || "",
          pubdate: article.pubdate || "",
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        }
      }).filter(Boolean),
    }
  } catch (err) {
    if (err.name === "AbortError") return { error: "Request timed out" }
    return { error: err.message }
  } finally {
    clear()
  }
}

export async function searchICD11(query) {
  if (!query?.trim()) return { error: "No search query provided" }
  const { signal, clear } = withTimeout()
  try {
    const encoded = encodeURIComponent(query.trim())
    const res = await fetch(
      `https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=${encoded}&maxList=10`,
      { signal }
    )
    if (!res.ok) throw new Error(`ICD-11 API returned ${res.status}`)
    const data = await res.json()
    const total = data[0] || 0
    const codes = data[1] || []
    const details = data[3] || []
    return {
      total,
      results: codes.map((code, i) => ({
        code,
        description: details[i]?.[0] || "",
      })),
    }
  } catch (err) {
    if (err.name === "AbortError") return { error: "Request timed out" }
    return { error: err.message }
  } finally {
    clear()
  }
}

export async function searchRxNorm(drug) {
  if (!drug?.trim()) return { error: "No drug name provided" }
  const { signal, clear } = withTimeout()
  try {
    const encoded = encodeURIComponent(drug.trim())
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encoded}`,
      { signal }
    )
    if (!res.ok) throw new Error(`RxNorm API returned ${res.status}`)
    const data = await res.json()
    const groups = data.drugGroup?.conceptGroup || []
    const concepts = []
    for (const group of groups) {
      if (group.conceptProperties) {
        for (const prop of group.conceptProperties.slice(0, 5)) {
          concepts.push({
            rxcui: prop.rxcui,
            name: prop.name,
            synonym: prop.synonym || "",
            tty: prop.tty || "",
          })
        }
      }
    }
    return { drugName: data.drugGroup?.name || drug, results: concepts }
  } catch (err) {
    if (err.name === "AbortError") return { error: "Request timed out" }
    return { error: err.message }
  } finally {
    clear()
  }
}
