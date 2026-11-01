// Inner pages open with a large heading and, where there is one, a wide still of a tower.
export default function PageHero({ children, image, alt = "" }) {
  return (
    <>
      <header className="pagehead">{children}</header>
      {image && (
        <div className="pageimg" data-r>
          <img data-drift src={"/img/renders/" + image + ".jpg"} width="1600" height="900" alt={alt || "Illustrative 3D render of a Comfort Builders tower"} />
        </div>
      )}
    </>
  );
}
